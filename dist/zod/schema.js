"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qbankSchema = exports.jobSchema = void 0;
const zod_1 = require("zod");
exports.jobSchema = zod_1.z.object({
    instruction: zod_1.z.string(),
    complexity: zod_1.z.enum(["beginner", "intermediate", "advanced"]),
    language: zod_1.z.string().optional(),
    course: zod_1.z.string().optional(),
    exam: zod_1.z.string().optional(),
    subject: zod_1.z.string(),
    type: zod_1.z.enum(["qbank", "theory"]),
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
exports.qbankSchema = zod_1.z.object({
    instruction: zod_1.z.string(),
    complexity: zod_1.z.enum(["beginner", "intermediate", "advanced"]),
    language: zod_1.z.string().optional(),
    course: zod_1.z.string().optional(),
    exam: zod_1.z.string().optional(),
    subject: zod_1.z.string(),
    weightage: zod_1.z.enum(["auto", "short", "long", "medium"]),
    type: zod_1.z.enum(["qbank"]),
    // topics: z.array(
    //   z.object({
    //     id: z.string(), // {id: 'topic-0-12dd8be1-9002-4cb2-b075-ad0adb8aada4',
    //     materialId: z.string(), // {id: 'topic-0-12dd8be1-9002-4cb2-b075-ad0adb8aada4',
    //     name: z.string(), // name: 'History and Overview of C++',
    //     weightage: z.enum(["low", "medium", "high"]), // weightage: 'low',
    //     subtopics: z.array(z.object({ id: z.string(), title: z.string() })), // subtopics: [ [Object], [Object], [Object], [Object], [Object] ],
    //     numericals: z.array(z.object({ id: z.string(), title: z.string() })), // numericals: [ [Object] ],
    //     formulas: z.boolean(), // formulas: false,
    //     examples: z.boolean(), // examples: true,
    //     completed: z.boolean(), // completed: false,
    //     tryCount: z.number(), // tryCount: 0
    //   })
    // ),
    topics: zod_1.z.array(zod_1.z.object({
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
    })),
});
