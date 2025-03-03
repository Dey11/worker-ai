"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completionQueue = void 0;
const bullmq_1 = require("bullmq");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const schema_1 = require("./zod/schema");
const theory_generator_1 = require("./ai/theory-generator");
const generate_pdf_1 = require("./lib/generate-pdf");
const object_storage_1 = require("./object-storage");
const constants_1 = require("./constants");
const axios_1 = __importDefault(require("axios"));
const bullmq_2 = require("bullmq");
const qna_generator_1 = require("./ai/qna-generator");
dotenv_1.default.config();
const connection = {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    password: process.env.REDIS_PASSWORD || "",
    tls: {},
};
exports.completionQueue = new bullmq_2.Queue("completionQueue", {
    connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        tls: {},
    },
    defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
    },
});
const theoryWorker = new bullmq_1.Worker(constants_1.QUEUE_NAME, (job) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = schema_1.jobSchema.safeParse(job.data);
        if (!res.success) {
            console.error(res.error);
            throw new Error("Invalid job data");
        }
        // Generate markdown content
        const [theoryMarkdown, usage] = yield (0, theory_generator_1.generateTheoryAction)(res.data);
        // Generate temporary PDF file path
        const tempDir = path_1.default.join(__dirname, "../temp");
        if (!fs_1.default.existsSync(tempDir)) {
            fs_1.default.mkdirSync(tempDir);
        }
        const timestamp = Date.now().toString();
        const tempFilePath = path_1.default.join(tempDir, `${timestamp}.pdf`);
        // Convert markdown to PDF
        yield (0, generate_pdf_1.generatePdfFromMarkdown)(theoryMarkdown, tempFilePath);
        // Upload to R2
        yield (0, object_storage_1.uploadPdfToR2)(tempFilePath, constants_1.BUCKET_NAME, `theory/topics/${res.data.topic.materialId}/${timestamp}.pdf`, {
            materialId: String(res.data.topic.materialId),
            id: String(res.data.topic.id),
            currindex: String(res.data.topic.currIndex),
            totalIndex: String(res.data.topic.totalIndex),
        });
        yield axios_1.default.post(`${process.env.BACKEND_URL}/api/generation/update-task`, {
            materialId: res.data.topic.materialId,
            id: res.data.topic.id,
            currIndex: res.data.topic.currIndex,
            totalIndex: res.data.topic.totalIndex,
            key: `theory/topics/${timestamp}.pdf`,
            usage: usage,
            success: true,
        });
    }
    catch (err) {
        console.error(err);
        yield axios_1.default.post(`${process.env.BACKEND_URL}/api/generation/update-task`, {
            materialId: job.data.topic.materialId,
            id: job.data.topic.id,
            currIndex: job.data.topic.currIndex,
            totalIndex: job.data.topic.totalIndex,
            key: "",
            usage: 0,
            success: false,
        });
    }
    finally {
        yield exports.completionQueue.add("completion", {
            materialId: job.data.topic.materialId,
            type: "theory",
        });
    }
}), {
    connection,
    concurrency: 3,
    removeOnComplete: {
        age: 3600, // keep up to 1 hour
        count: 200, // keep up to 1000 jobs
    },
});
const qnaWorker = new bullmq_1.Worker(constants_1.QNA_QUEUE_NAME, (job) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = schema_1.qbankSchema.safeParse(job.data);
        if (!res.success) {
            console.error(res.error);
            throw new Error("Invalid job data");
        }
        yield (0, qna_generator_1.generateQnaAction)(res.data);
    }
    catch (err) {
        console.error(err);
    }
}), {
    connection,
    concurrency: 3,
    removeOnComplete: {
        age: 3600, // keep up to 1 hour
        count: 60, // keep up to 1000 jobs
    },
});
const completionWorker = new bullmq_1.Worker("completionQueue", (job) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield axios_1.default.post(`${process.env.BACKEND_URL}/api/generation/progress`, {
            materialId: job.data.materialId,
            type: job.data.type,
        });
    }
    catch (err) {
        console.error(err);
    }
}), { connection });
const mergePdfWorker = new bullmq_1.Worker(constants_1.MERGE_PDF_QUEUE_NAME, (job) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const materialId = job.data.materialId;
        const key = yield (0, object_storage_1.listObjectAndMerge)(constants_1.BUCKET_NAME, materialId, job.data.type);
        yield axios_1.default.post(`${process.env.BACKEND_URL}/api/generation/complete`, {
            materialId: materialId,
            key: key,
        });
    }
    catch (err) {
        console.error("Error in mergePdfWorker:", err);
    }
}), {
    connection,
    concurrency: 5,
    removeOnComplete: {
        age: 3600, // keep up to 1 hour
        count: 10, // keep up to 1000 jobs
    },
});
