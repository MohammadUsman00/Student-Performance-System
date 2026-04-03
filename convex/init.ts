import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existingStudents = await ctx.db.query("students").take(1);
    const [activeModel] = await ctx.db
      .query("modelConfigs")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .take(1);

    const sampleStudents = [
      {
        name: "Alice Johnson",
        studentId: "STU001",
        email: "alice@school.edu",
        gender: "F",
        age: 18,
        address: "U",
        famsize: "GT3",
        Pstatus: "T",
        Medu: 4,
        Fedu: 4,
        Mjob: "teacher",
        Fjob: "health",
        reason: "course",
        guardian: "mother",
        traveltime: 1,
        studytime: 3,
        failures: 0,
        schoolsup: false,
        famsup: true,
        paid: false,
        activities: true,
        nursery: true,
        higher: true,
        internet: true,
        romantic: false,
        famrel: 4,
        freetime: 3,
        goout: 4,
        Dalc: 1,
        Walc: 1,
        health: 3,
        absences: 2,
        previousMarks: 85,
      },
      {
        name: "Bob Smith",
        studentId: "STU002",
        email: "bob@school.edu",
        gender: "M",
        age: 17,
        address: "R",
        famsize: "LE3",
        Pstatus: "A",
        Medu: 2,
        Fedu: 2,
        Mjob: "services",
        Fjob: "other",
        reason: "home",
        guardian: "father",
        traveltime: 2,
        studytime: 1,
        failures: 1,
        schoolsup: true,
        famsup: false,
        paid: true,
        activities: false,
        nursery: false,
        higher: true,
        internet: false,
        romantic: true,
        famrel: 3,
        freetime: 2,
        goout: 5,
        Dalc: 2,
        Walc: 3,
        health: 2,
        absences: 12,
        previousMarks: 55,
      },
       {
        name: "Charlie Brown",
        studentId: "STU003",
        email: "charlie@school.edu",
        gender: "M",
        age: 19,
        address: "U",
        famsize: "GT3",
        Pstatus: "T",
        Medu: 3,
        Fedu: 3,
        Mjob: "other",
        Fjob: "other",
        reason: "reputation",
        guardian: "mother",
        traveltime: 1,
        studytime: 2,
        failures: 0,
        schoolsup: false,
        famsup: true,
        paid: false,
        activities: true,
        nursery: true,
        higher: true,
        internet: true,
        romantic: false,
        famrel: 5,
        freetime: 4,
        goout: 2,
        Dalc: 1,
        Walc: 1,
        health: 5,
        absences: 0,
        previousMarks: 72,
      }
    ];

    let insertedStudents = 0;

    if (existingStudents.length === 0) {
      for (const student of sampleStudents) {
        await ctx.db.insert("students", student);
      }
      insertedStudents = sampleStudents.length;
    }

    if (!activeModel) {
      await ctx.db.insert("modelConfigs", {
        modelName: "random_forest",
        isActive: true,
        lastUpdated: Date.now(),
      });
    }

    return {
      skipped: insertedStudents === 0,
      existingCount: existingStudents.length,
      insertedStudents,
    };
  },
});
