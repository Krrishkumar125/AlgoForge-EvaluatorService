import { Job, Worker } from "bullmq";

import redisConnection from "../config/redisConfig.js";
import SampleJob from "../jobs/sampleJob.js";

export default function sampleWorker(queueName: string) {
  new Worker(
    queueName,
    async (job: Job) => {
      if (job.name === "SampleJob") {
        const sampleJobInstance = new SampleJob(job.data);

        sampleJobInstance.handle(job);

        return true;
      }
    },
    { connection: redisConnection },
  );
}
