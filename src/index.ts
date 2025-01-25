import { Job, Worker } from "bullmq";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { jobSchema } from "./zod/schema";
import { generateTheoryAction } from "./ai/theory-generator";
import { generatePdfFromMarkdown } from "./lib/generate-pdf";
import { listObjectAndMerge, uploadPdfToR2 } from "./object-storage";
import { BUCKET_NAME, MERGE_PDF_QUEUE_NAME, QUEUE_NAME } from "./constants";
import axios from "axios";
import { Queue } from "bullmq";

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD || "",
  tls: {},
};

const completionQueue = new Queue("completionQueue", {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT as unknown as number,
    password: process.env.REDIS_PASSWORD,
    tls: {},
  },
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: true,
  },
});

const theoryWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    try {
      const res = jobSchema.safeParse(job.data);
      if (!res.success) {
        console.error(res.error);
        throw new Error("Invalid job data");
      }

      // Generate markdown content
      const [theoryMarkdown, usage] = await generateTheoryAction(res.data);

      // Generate temporary PDF file path
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }
      const timestamp = Date.now().toString();
      const tempFilePath = path.join(tempDir, `${timestamp}.pdf`);

      // Convert markdown to PDF
      await generatePdfFromMarkdown(theoryMarkdown as string, tempFilePath);

      // Upload to R2
      await uploadPdfToR2(
        tempFilePath,
        BUCKET_NAME,
        `theory/topics/${res.data.topic.materialId}/${timestamp}.pdf`,
        {
          materialId: String(res.data.topic.materialId),
          id: String(res.data.topic.id),
          currindex: String(res.data.topic.currIndex),
          totalIndex: String(res.data.topic.totalIndex),
        }
      );

      await axios.post(`${process.env.BACKEND_URL}/api/theory`, {
        materialId: res.data.topic.materialId,
        id: res.data.topic.id,
        currIndex: res.data.topic.currIndex,
        totalIndex: res.data.topic.totalIndex,
        key: `theory/topics/${timestamp}.pdf`,
        usage: usage,
        success: true,
      });
    } catch (err) {
      console.error(err);
      await axios.post(`${process.env.BACKEND_URL}/api/theory`, {
        materialId: job.data.topic.materialId,
        id: job.data.topic.id,
        currIndex: job.data.topic.currIndex,
        totalIndex: job.data.topic.totalIndex,
        key: "",
        usage: 0,
        success: false,
      });
    } finally {
      await completionQueue.add("completion", {
        materialId: job.data.topic.materialId,
      });
    }
  },
  {
    connection,
    concurrency: 4,
    removeOnComplete: {
      age: 3600, // keep up to 1 hour
      count: 200, // keep up to 1000 jobs
    },
  }
);

const completionWorker = new Worker(
  "completionQueue",
  async (job: Job) => {
    try {
      await axios.post(`${process.env.BACKEND_URL}/api/theory/progress`, {
        materialId: job.data.materialId,
      });
    } catch (err) {
      console.error(err);
    }
  },
  { connection }
);

const mergePdfWorker = new Worker(
  MERGE_PDF_QUEUE_NAME,
  async (job: Job) => {
    try {
      const materialId = job.data.materialId as string;
      const key = await listObjectAndMerge(BUCKET_NAME, materialId);
      await axios.post(`${process.env.BACKEND_URL}/api/theory/complete`, {
        materialId: materialId,
        key: key,
      });
    } catch (err) {
      console.error(err);
    }
  },
  {
    connection,
    concurrency: 5,
    removeOnComplete: {
      age: 3600, // keep up to 1 hour
      count: 10, // keep up to 1000 jobs
    },
  }
);
