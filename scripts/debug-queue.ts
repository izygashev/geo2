import { Queue } from "bullmq";

function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "localhost",
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
    maxRetriesPerRequest: null as null,
  };
}

const connection = parseRedisUrl(process.env.REDIS_URL ?? "redis://localhost:6379");

async function main() {
  const queue = new Queue("report-generation", { connection });

  console.log("=== BullMQ Queue: report-generation ===\n");

  const waiting = await queue.getWaiting();
  const active = await queue.getActive();
  const delayed = await queue.getDelayed();
  const failed = await queue.getFailed();
  const completed = await queue.getCompleted(0, 5);

  console.log(`Waiting: ${waiting.length}`);
  for (const j of waiting) {
    console.log(`  Job ${j.id}: reportId=${j.data?.reportId}, added=${new Date(j.timestamp).toLocaleString()}`);
  }

  console.log(`Active: ${active.length}`);
  for (const j of active) {
    console.log(`  Job ${j.id}: reportId=${j.data?.reportId}, progress=${JSON.stringify(j.progress)}, attempts=${j.attemptsMade}`);
  }

  console.log(`Delayed: ${delayed.length}`);
  for (const j of delayed) {
    console.log(`  Job ${j.id}: reportId=${j.data?.reportId}, delay=${j.delay}`);
  }

  console.log(`Failed: ${failed.length}`);
  for (const j of failed) {
    console.log(`  Job ${j.id}: reportId=${j.data?.reportId}, reason=${j.failedReason}, attempts=${j.attemptsMade}`);
  }

  console.log(`Completed (last 5): ${completed.length}`);
  for (const j of completed) {
    console.log(`  Job ${j.id}: reportId=${j.data?.reportId}, finished=${j.finishedOn ? new Date(j.finishedOn).toLocaleString() : 'N/A'}`);
  }

  // Check workers
  const workers = await queue.getWorkers();
  console.log(`\nConnected Workers: ${workers.length}`);
  for (const w of workers) {
    console.log(`  Worker: ${JSON.stringify(w)}`);
  }

  await queue.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
