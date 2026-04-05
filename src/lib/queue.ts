import { Queue } from "bullmq";
import { redisConnection } from "@/lib/redis";

export const reportQueue = new Queue("report-generation", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: { count: 100 },  // Храним последние 100 завершённых
    removeOnFail: { count: 500 },      // Храним последние 500 упавших
  },
});
