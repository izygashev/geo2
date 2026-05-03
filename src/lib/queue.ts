import { Queue } from "bullmq";
import { redisConnection } from "@/lib/redis";

export const reportQueue = new Queue("report-generation", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // 5s → 10s → 20s
    },
    removeOnComplete: { count: 100 },
    removeOnFail: false, // Keep ALL failed jobs — visible in Bull Board as DLQ
  },
});

export const pdfQueue = new Queue("pdf-generation", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 200 },
    removeOnFail: false, // Keep ALL failed jobs — visible in Bull Board as DLQ
  },
});
