import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Batch-create students from a dataset upload (e.g. CSV).
 * Skips rows whose studentId already exists.
 * Returns counts of inserted vs skipped.
 */
export const batchCreate = mutation({
  args: {
    students: v.array(
      v.object({
        name: v.string(),
        studentId: v.string(),
        email: v.string(),
        gender: v.string(),
        age: v.number(),
        address: v.string(),
        famsize: v.string(),
        Pstatus: v.string(),
        Medu: v.number(),
        Fedu: v.number(),
        Mjob: v.string(),
        Fjob: v.string(),
        reason: v.string(),
        guardian: v.string(),
        traveltime: v.number(),
        studytime: v.number(),
        failures: v.number(),
        schoolsup: v.boolean(),
        famsup: v.boolean(),
        paid: v.boolean(),
        activities: v.boolean(),
        nursery: v.boolean(),
        higher: v.boolean(),
        internet: v.boolean(),
        romantic: v.boolean(),
        famrel: v.number(),
        freetime: v.number(),
        goout: v.number(),
        Dalc: v.number(),
        Walc: v.number(),
        health: v.number(),
        absences: v.number(),
        previousMarks: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let skipped = 0;

    for (const student of args.students) {
      const existing = await ctx.db
        .query("students")
        .withIndex("by_studentId", (q) => q.eq("studentId", student.studentId))
        .unique();

      if (existing) {
        skipped++;
      } else {
        await ctx.db.insert("students", student);
        inserted++;
      }
    }

    return { inserted, skipped, total: args.students.length };
  },
});
