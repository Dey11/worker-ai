"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobObj = void 0;
const zod_1 = require("zod");
exports.jobObj = zod_1.z.object({
    instruction: zod_1.z.string(),
    data: zod_1.z.object({
        status: zod_1.z.enum(["pending", "inprogress", "completed", "failed"]),
        id: zod_1.z.string(),
        data: zod_1.z.optional(zod_1.z.any()),
        createdAt: zod_1.z.date(),
        updatedAt: zod_1.z.date(),
        materialId: zod_1.z.string(),
        topic: zod_1.z.string(),
        tokensUsed: zod_1.z.number(),
        partialResultUrl: zod_1.z.string().optional(),
    }),
});
