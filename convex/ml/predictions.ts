import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";
import { api } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { mlServiceBaseUrl } from "./serviceUrl";

/** Strip Convex system fields + non-ML fields, return only ML features. */
function extractMlFeatures(
  student: Doc<"students">
): Record<string, unknown> {
  const {
    _id,
    _creationTime,
    name,
    studentId,
    email,
    ...mlFeatures
  } = student;
  return mlFeatures;
}

export const predictAll = action({
  args: {},
  handler: async (ctx: ActionCtx): Promise<Array<Record<string, unknown>>> => {
    const students: Doc<"students">[] = await ctx.runQuery(
      api.students.list.list
    );
    const activeModel: Doc<"modelConfigs"> | null = await ctx.runQuery(
      api.ml.models.getActiveModel
    );
    const modelName = activeModel?.modelName || "linear_regression";

    const predictions: Array<Record<string, unknown>> = [];

    for (const student of students) {
      const mlFeatures = extractMlFeatures(student);

      const resp = await fetch(`${mlServiceBaseUrl()}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentData: mlFeatures,
          modelName,
        }),
      });

      if (resp.ok) {
        const pred = await resp.json();
        await ctx.runMutation(api.ml.predictions.storePrediction, {
          studentId: student.studentId,
          predictedScore: pred.predictedScore,
          riskLevel: pred.riskLevel,
          activeModel: modelName,
        });
        predictions.push({ id: student.studentId, ...pred });
      }
    }

    return predictions;
  },
});

/** Predict for a single student by their studentId string. */
export const predictSingle = action({
  args: { studentId: v.string() },
  handler: async (
    ctx: ActionCtx,
    args
  ): Promise<Record<string, unknown>> => {
    const student: Doc<"students"> | null = await ctx.runQuery(
      api.students.list.getById,
      { studentId: args.studentId }
    );

    if (!student) {
      throw new Error(`Student "${args.studentId}" not found.`);
    }

    const activeModel: Doc<"modelConfigs"> | null = await ctx.runQuery(
      api.ml.models.getActiveModel
    );
    const modelName: string = activeModel?.modelName || "linear_regression";

    const mlFeatures = extractMlFeatures(student);

    const resp = await fetch(`${mlServiceBaseUrl()}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentData: mlFeatures, modelName }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "Unknown error");
      throw new Error(`ML prediction failed: ${resp.status} — ${text}`);
    }

    const pred = (await resp.json()) as {
      predictedScore: number;
      riskLevel: string;
    };

    await ctx.runMutation(api.ml.predictions.storePrediction, {
      studentId: student.studentId,
      predictedScore: pred.predictedScore,
      riskLevel: pred.riskLevel,
      activeModel: modelName,
    });

    return pred as Record<string, unknown>;
  },
});

export const storePrediction = mutation({
  args: {
    studentId: v.string(),
    predictedScore: v.number(),
    riskLevel: v.string(),
    activeModel: v.string(),
  },
  handler: async (ctx, args) => {
    const existingRows = await ctx.db
      .query("predictions")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(1);
    const existing = existingRows[0];

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        timestamp: Date.now(),
      });
    } else {
      await ctx.db.insert("predictions", {
        ...args,
        timestamp: Date.now(),
      });
    }
  },
});

export const getPredictions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("predictions").take(200);
  },
});
