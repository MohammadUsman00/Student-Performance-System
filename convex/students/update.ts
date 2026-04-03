import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const update = mutation({
  args: {
    id: v.id("students"),
    age: v.optional(v.number()),
    Medu: v.optional(v.number()),
    Fedu: v.optional(v.number()),
    studytime: v.optional(v.number()),
    failures: v.optional(v.number()),
    schoolsup: v.optional(v.boolean()),
    famsup: v.optional(v.boolean()),
    paid: v.optional(v.boolean()),
    activities: v.optional(v.boolean()),
    nursery: v.optional(v.boolean()),
    higher: v.optional(v.boolean()),
    internet: v.optional(v.boolean()),
    romantic: v.optional(v.boolean()),
    famrel: v.optional(v.number()),
    freetime: v.optional(v.number()),
    goout: v.optional(v.number()),
    Dalc: v.optional(v.number()),
    Walc: v.optional(v.number()),
    health: v.optional(v.number()),
    absences: v.optional(v.number()),
    previousMarks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});
