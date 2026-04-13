import { v } from "convex/values";
import { query } from "../_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("students").take(200);
  },
});

export const getById = query({
  args: { studentId: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("students")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(1);
    return rows[0] ?? null;
  },
});
