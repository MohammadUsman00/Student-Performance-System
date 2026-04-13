import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { mergeStudentPartial } from "./defaults";
import { partialStudent } from "./partialArgs";

/**
 * Batch-create students from a dataset upload (e.g. CSV).
 * Each row may be partial; merged with defaults server-side.
 * Skips rows whose studentId already exists.
 */
export const batchCreate = mutation({
  args: {
    students: v.array(partialStudent),
  },
  handler: async (ctx, args) => {
    const merged = args.students.map((p) =>
      mergeStudentPartial(p as Record<string, unknown>)
    );

    // Never insert two rows for the same studentId in one chunk (CSV often repeats IDs).
    // Later rows win over earlier ones for the same key.
    const byStudentId = new Map<string, (typeof merged)[number]>();
    for (const row of merged) {
      byStudentId.set(row.studentId, row);
    }
    const uniqueByKey = [...byStudentId.values()];
    const skippedDupesInChunk = merged.length - uniqueByKey.length;

    // Use .take(1), not .unique(): duplicates can exist in DB (legacy / races); .unique() throws.
    const existence = await Promise.all(
      uniqueByKey.map((student) =>
        ctx.db
          .query("students")
          .withIndex("by_studentId", (q) => q.eq("studentId", student.studentId))
          .take(1)
      )
    );

    let skipped = skippedDupesInChunk;
    const toInsert: typeof merged = [];
    for (let i = 0; i < uniqueByKey.length; i++) {
      const existingRow = existence[i]![0];
      if (existingRow !== undefined) {
        skipped++;
      } else {
        toInsert.push(uniqueByKey[i]!);
      }
    }

    await Promise.all(toInsert.map((doc) => ctx.db.insert("students", doc)));

    return {
      inserted: toInsert.length,
      skipped,
      total: args.students.length,
    };
  },
});
