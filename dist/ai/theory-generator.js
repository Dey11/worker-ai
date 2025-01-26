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
exports.generateTheoryAction = void 0;
const google_1 = require("@ai-sdk/google");
const deepseek_1 = require("@ai-sdk/deepseek");
const ai_1 = require("ai");
const generator_1 = require("../prompts/generator");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const google = (0, google_1.createGoogleGenerativeAI)({
    apiKey: process.env.GOOGLE_API_KEY,
});
const deepseek = (0, deepseek_1.createDeepSeek)({
    apiKey: (_a = process.env.DEEPSEEK_API_KEY) !== null && _a !== void 0 ? _a : "",
});
const model1 = google("gemini-2.0-flash-exp");
const model2 = deepseek("deepseek-chat");
const MAX_TOKENS = 8192;
const generateTheoryAction = (state) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text, usage } = yield (0, ai_1.generateText)({
            model: model1,
            maxTokens: MAX_TOKENS,
            system: generator_1.theoryGeneratorSystemPrompt,
            maxRetries: 2,
            messages: [
                {
                    role: "system",
                    content: `Instruction: ${state.instruction}. Course: ${state.course}.
          Exam: ${state.exam}. Language: ${state.language}. Subject: ${state.subject}`,
                },
                {
                    role: "user",
                    content: JSON.stringify(state.topic.data),
                },
            ],
        });
        if (!usage.totalTokens) {
            const { text, usage } = yield (0, ai_1.generateText)({
                model: model2,
                maxTokens: MAX_TOKENS,
                system: generator_1.theoryGeneratorSystemPrompt,
                maxRetries: 2,
                messages: [
                    {
                        role: "system",
                        content: `Instruction: ${state.instruction}. Course: ${state.course}.
          Exam: ${state.exam}. Language: ${state.language}. Subject: ${state.subject}`,
                    },
                    {
                        role: "user",
                        content: JSON.stringify(state.topic.data),
                    },
                ],
            });
            return [text, usage.totalTokens];
        }
        else {
            return [text, usage.totalTokens];
        }
    }
    catch (err) {
        console.error(err);
        throw new Error("Failed to generate theory");
    }
});
exports.generateTheoryAction = generateTheoryAction;
