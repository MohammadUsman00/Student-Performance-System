import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    // Guard against duplicate studentId
    const existing = await ctx.db
      .query("students")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .unique();

    if (existing) {
      throw new Error(
        `A student with ID "${args.studentId}" already exists. Please use a unique student ID.`
      );
    }

    return await ctx.db.insert("students", args);
  },
});
