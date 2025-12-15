import { Job, Worker } from "bullmq";

import redisConnection from "../config/redisConfig.js";
import SubmissionJob from "../jobs/submissionJob.js";

export default function submissionWorker(queueName: string) {
  new Worker(
    queueName,
    async (job: Job) => {
      if (job.name === "SubmissionJob") {
        const submissionJobInstance = new SubmissionJob(job.data);

        await submissionJobInstance.handle(job);

        return true;
      }
    },
    { connection: redisConnection },
  );
}
