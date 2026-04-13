import { mutation } from "../_generated/server";
import { mergeStudentPartial } from "./defaults";
import { partialStudent } from "./partialArgs";

export const create = mutation({
  args: partialStudent,
  handler: async (ctx, args) => {
    const merged = mergeStudentPartial(args as Record<string, unknown>);

    const existingRows = await ctx.db
      .query("students")
      .withIndex("by_studentId", (q) => q.eq("studentId", merged.studentId))
      .take(1);
    const existing = existingRows[0];

    if (existing) {
      throw new Error(
        `A student with ID "${merged.studentId}" already exists. Please use a unique student ID.`
      );
    }

    return await ctx.db.insert("students", merged);
  },
});
