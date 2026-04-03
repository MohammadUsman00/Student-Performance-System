import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  students: defineTable({
    // Core Info
    name: v.string(),
    studentId: v.string(),
    email: v.string(),
    
    // Demographic & Social (Kaggle Style)
    gender: v.string(), // "M", "F"
    age: v.number(),
    address: v.string(), // "U", "R"
    famsize: v.string(), // "GT3", "LE3"
    Pstatus: v.string(), // "T", "A"
    
    // Family & Background
    Medu: v.number(), // 0-4
    Fedu: v.number(), // 0-4
    Mjob: v.string(),
    Fjob: v.string(),
    reason: v.string(),
    guardian: v.string(),
    
    // Academic & Behavior
    traveltime: v.number(), // 1-4
    studytime: v.number(),  // 1-4
    failures: v.number(),   // 0-3
    schoolsup: v.boolean(),
    famsup: v.boolean(),
    paid: v.boolean(),
    activities: v.boolean(),
    nursery: v.boolean(),
    higher: v.boolean(),
    internet: v.boolean(),
    romantic: v.boolean(),
    
    // Health & Lifestyle
    famrel: v.number(), // 1-5
    freetime: v.number(), // 1-5
    goout: v.number(), // 1-5
    Dalc: v.number(), // 1-5
    Walc: v.number(), // 1-5
    health: v.number(), // 1-5
    absences: v.number(), // 0-93
    
    // Previous Performance (if available)
    previousMarks: v.number(), // G1/G2 equivalent
  }).index("by_studentId", ["studentId"]),

  modelConfigs: defineTable({
    modelName: v.string(), 
    isActive: v.boolean(),
    lastUpdated: v.number(),
  })
    .index("by_modelName", ["modelName"])
    .index("by_isActive", ["isActive"]),

  modelMetrics: defineTable({
    modelName: v.string(),
    mae: v.number(),
    rmse: v.number(),
    r2: v.number(),
    accuracy: v.number(),
    precision: v.number(),
    recall: v.number(),
    f1: v.number(),
    timestamp: v.number(),
  }).index("by_modelName_and_timestamp", ["modelName", "timestamp"]),

  predictions: defineTable({
    studentId: v.string(),
    predictedScore: v.number(),
    riskLevel: v.string(),
    activeModel: v.string(),
    timestamp: v.number(),
  }).index("by_studentId", ["studentId"]),
});
