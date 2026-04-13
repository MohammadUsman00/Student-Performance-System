import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";

type TableName = "students" | "predictions" | "modelMetrics" | "modelConfigs";

/** Delete all documents in a table in bounded batches (stays within mutation limits). */
async function deleteAllInTable(ctx: MutationCtx, table: TableName) {
  for (;;) {
    const batch = await ctx.db.query(table).take(300);
    if (batch.length === 0) break;
    await Promise.all(batch.map((doc) => ctx.db.delete(doc._id)));
  }
}

/**
 * Remove all students, predictions, model metric history, and model selection.
 * Re-inserts a single default active model so the app remains usable.
 */
export const clearAllApplicationData = mutation({
  args: {},
  handler: async (ctx) => {
    await deleteAllInTable(ctx, "predictions");
    await deleteAllInTable(ctx, "students");
    await deleteAllInTable(ctx, "modelMetrics");
    await deleteAllInTable(ctx, "modelConfigs");

    await ctx.db.insert("modelConfigs", {
      modelName: "random_forest",
      isActive: true,
      lastUpdated: Date.now(),
    });

    return { ok: true as const };
  },
});
