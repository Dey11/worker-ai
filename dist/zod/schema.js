"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobSchema = void 0;
const zod_1 = require("zod");
exports.jobSchema = zod_1.z.object({
    instruction: zod_1.z.string(),
    complexity: zod_1.z.enum(["beginner", "intermediate", "advanced"]),
    language: zod_1.z.string().optional(),
    course: zod_1.z.string().optional(),
    exam: zod_1.z.string().optional(),
    subject: zod_1.z.string(),
    topic: zod_1.z.object({
        id: zod_1.z.string(),
        materialId: zod_1.z.string(),
        topic: zod_1.z.string(),
        status: zod_1.z.enum(["pending", "inprogress", "completed", "failed"]),
        tokensUsed: zod_1.z.number(),
        partialResultUrl: zod_1.z.string().optional().nullable(),
        createdAt: zod_1.z.string(),
        updatedAt: zod_1.z.string(),
        currIndex: zod_1.z.number(),
        totalIndex: zod_1.z.number(),
        data: zod_1.z.object({
            id: zod_1.z.string(), // {id: 'topic-0-12dd8be1-9002-4cb2-b075-ad0adb8aada4',
            name: zod_1.z.string(), // name: 'History and Overview of C++',
            weightage: zod_1.z.enum(["low", "medium", "high"]), // weightage: 'low',
            subtopics: zod_1.z.array(zod_1.z.object({ id: zod_1.z.string(), title: zod_1.z.string() })), // subtopics: [ [Object], [Object], [Object], [Object], [Object] ],
            numericals: zod_1.z.array(zod_1.z.object({ id: zod_1.z.string(), title: zod_1.z.string() })), // numericals: [ [Object] ],
            formulas: zod_1.z.boolean(), // formulas: false,
            examples: zod_1.z.boolean(), // examples: true,
            completed: zod_1.z.boolean(), // completed: false,
            tryCount: zod_1.z.number(), // tryCount: 0
        }),
    }),
});
