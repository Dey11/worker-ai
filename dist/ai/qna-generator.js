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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQnaAction = void 0;
const google_1 = require("@ai-sdk/google");
const deepseek_1 = require("@ai-sdk/deepseek");
const ai_1 = require("ai");
const generator_1 = require("../prompts/generator");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const generate_pdf_1 = require("../lib/generate-pdf");
const object_storage_1 = require("../object-storage");
const constants_1 = require("../constants");
const axios_1 = __importDefault(require("axios"));
const __1 = require("..");
dotenv_1.default.config();
const google = (0, google_1.createGoogleGenerativeAI)({
    apiKey: process.env.GOOGLE_API_KEY,
});
const deepseek = (0, deepseek_1.createDeepSeek)({
    apiKey: (_a = process.env.DEEPSEEK_API_KEY) !== null && _a !== void 0 ? _a : "",
});
const model1 = google("gemini-2.0-flash-exp");
const model2 = deepseek("deepseek-chat");
const MAX_TOKENS = 8000;
const generateQnaAction = (state) => __awaiter(void 0, void 0, void 0, function* () {
    const materialId = state.topics[0].materialId;
    const tempDir = path_1.default.join(__dirname, `../../${materialId}`);
    if (!fs_1.default.existsSync(tempDir)) {
        fs_1.default.mkdirSync(tempDir);
    }
    const allTopics = state.topics;
    let numbering = 1;
    for (const topic of allTopics) {
        try {
            const { text, usage } = yield (0, ai_1.generateText)({
                model: model1,
                maxTokens: MAX_TOKENS,
                system: generator_1.qnaGeneratorSystemPrompt,
                maxRetries: 2,
                messages: [
                    {
                        role: "system",
                        content: `Instruction: ${state.instruction}. Course: ${state.course}.
          Exam: ${state.exam}. Language: ${state.language}. Subject: ${state.subject}.
          Start the current numbering from ${numbering}. Weightage in general should be more on ${state.weightage} type questions.
          If it is auto, feel free to choose yourself. If it is long, try to keep long type questions but keep them minimal. 
          Complexity should be ${state.complexity}.`,
                    },
                    {
                        role: "user",
                        content: JSON.stringify(topic.data),
                    },
                ],
            });
            let formatDoc;
            formatDoc = text.split("QNAEND");
            numbering = 1 + parseInt(formatDoc[1]);
            const newTime = Date.now().toString();
            const tempFilePath = path_1.default.join(tempDir, `${newTime}.pdf`);
            yield (0, generate_pdf_1.generatePdfFromMarkdown)(formatDoc[0], tempFilePath);
            yield (0, object_storage_1.uploadPdfToR2)(tempFilePath, constants_1.BUCKET_NAME, `qbank/topics/${materialId}/${newTime}.pdf`, {
                materialId,
                id: String(topic.id),
            });
            yield axios_1.default.post(`${process.env.BACKEND_URL}/api/generation/update-task`, {
                materialId: materialId,
                id: topic.id,
                currIndex: topic.currIndex,
                totalIndex: topic.totalIndex,
                key: `qbank/topics/${newTime}.pdf`,
                usage: usage.totalTokens,
                success: true,
            });
        }
        catch (error) {
            console.error(error);
            yield axios_1.default.post(`${process.env.BACKEND_URL}/api/generation/update-task`, {
                materialId: materialId,
                id: topic.id,
                currIndex: topic.currIndex,
                totalIndex: topic.totalIndex,
                key: ``,
                usage: 0,
                success: false,
            });
        }
        yield __1.completionQueue.add("completion", {
            materialId: materialId,
            type: "qbank",
        });
    }
});
exports.generateQnaAction = generateQnaAction;
