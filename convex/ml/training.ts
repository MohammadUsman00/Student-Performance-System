import { v } from "convex/values";
import { action, mutation } from "../_generated/server";
import { api } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { mlServiceBaseUrl } from "./serviceUrl";

type TrainingMetric = {
  modelName: string;
  regressionMetrics: { mae: number; rmse: number; r2: number };
  classificationMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
  };
  lastTrained: number;
};

type TrainAllResponse = { status: string; trainingRows: number; metrics: TrainingMetric[] };

export const triggerTraining = action({
  args: {},
  handler: async (ctx: ActionCtx): Promise<TrainingMetric[]> => {
    const students: Doc<"students">[] = await ctx.runQuery(api.students.list.list);
    if (students.length === 0) {
      throw new Error("No students available for training.");
    }

    const trainingRows: Record<string, unknown>[] = students.map((s) => {
      const { _id, _creationTime, ...row } = s;
      return row;
    });

    const response = await fetch(`${mlServiceBaseUrl()}/train-all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ students: trainingRows }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "Unknown error");
      throw new Error(`Failed to train models: ${response.status} — ${text}`);
    }

    const data = (await response.json()) as TrainAllResponse;

    // Store metrics in DB
    for (const model of data.metrics) {
      await ctx.runMutation(api.ml.training.updateMetrics, {
        modelName: model.modelName,
        mae: model.regressionMetrics.mae,
        rmse: model.regressionMetrics.rmse,
        r2: model.regressionMetrics.r2,
        accuracy: model.classificationMetrics.accuracy,
        precision: model.classificationMetrics.precision,
        recall: model.classificationMetrics.recall,
        f1: model.classificationMetrics.f1,
      });
    }

    return data.metrics;
  },
});

export const updateMetrics = mutation({
  args: {
    modelName: v.string(),
    mae: v.number(),
    rmse: v.number(),
    r2: v.number(),
    accuracy: v.number(),
    precision: v.number(),
    recall: v.number(),
    f1: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("modelMetrics", {
      ...args,
      timestamp: Date.now(),
    });
  },
});
