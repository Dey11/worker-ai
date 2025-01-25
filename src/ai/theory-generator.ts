import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import { theoryGeneratorSystemPrompt } from "../prompts/generator";
import { jobSchema } from "../zod/schema";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});
const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
});
const model1 = google("gemini-2.0-flash-exp");
const model2 = deepseek("deepseek-chat");

const MAX_TOKENS = 8192;

export const generateTheoryAction = async (
  state: z.infer<typeof jobSchema>
) => {
  try {
    const { text, usage } = await generateText({
      model: model1,
      maxTokens: MAX_TOKENS,
      system: theoryGeneratorSystemPrompt,
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
      const { text, usage } = await generateText({
        model: model2,
        maxTokens: MAX_TOKENS,
        system: theoryGeneratorSystemPrompt,
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
    } else {
      return [text, usage.totalTokens];
    }
  } catch (err) {
    console.error(err);
    throw new Error("Failed to generate theory");
  }
};
