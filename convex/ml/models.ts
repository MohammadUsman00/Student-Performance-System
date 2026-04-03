import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";

const ML_SERVICE_URL = "http://localhost:8000";

export const setActiveModel = mutation({
  args: { modelName: v.string() },
  handler: async (ctx, args) => {
    const activeConfigs = await ctx.db
      .query("modelConfigs")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .take(10);
    for (const config of activeConfigs) {
      await ctx.db.patch(config._id, { isActive: false });
    }

    const existing = await ctx.db
      .query("modelConfigs")
      .withIndex("by_modelName", (q) => q.eq("modelName", args.modelName))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isActive: true,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("modelConfigs", {
        modelName: args.modelName,
        isActive: true,
        lastUpdated: Date.now(),
      });
    }
  },
});

export const getActiveModel = query({
  args: {},
  handler: async (ctx) => {
    const [activeConfig] = await ctx.db
      .query("modelConfigs")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .take(1);
    return activeConfig ?? null;
  },
});

export const getMetrics = query({
  args: {},
  handler: async (ctx) => {
    const models = ["linear_regression", "random_forest", "decision_tree"];
    const results = [];
    for (const m of models) {
      const [latest] = await ctx.db
        .query("modelMetrics")
        .withIndex("by_modelName_and_timestamp", (q) => q.eq("modelName", m))
        .order("desc")
        .take(1);
      if (latest) {
        results.push(latest);
      }
    }
    return results;
  },
});

/** Check if the ML microservice is reachable. */
export const checkHealth = action({
  args: {},
  handler: async (_ctx: ActionCtx) => {
    try {
      const resp = await fetch(`${ML_SERVICE_URL}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (resp.ok) {
        const data = await resp.json();
        return {
          online: true,
          trained: data.trained ?? false,
        };
      }
      return { online: false, trained: false };
    } catch {
      return { online: false, trained: false };
    }
  },
});
