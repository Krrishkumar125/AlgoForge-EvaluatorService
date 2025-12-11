import type { Job } from "bullmq";

import type { IJob } from "../types/bullMqJobDefinition.js";
import type { ExecutionResponse } from "../types/codeExecutorStrategy.js";
import type { SubmissionPayload } from "../types/submissionPayload.js";
import createExecutor from "../utils/executorFactory.js";

export default class SubmissionJob implements IJob {
  name: string;
  payload: Record<string, SubmissionPayload>;
  constructor(payload: Record<string, SubmissionPayload>) {
    this.payload = payload;
    this.name = this.constructor.name;
  }
  handle = async (job?: Job) => {
    console.log("Handler of the job called");
    console.log(this.payload);
    if (job) {
      const key = Object.keys(this.payload)[0];
      console.log(key);
      if (!key) {
        console.log("No key found in payload");
        return;
      }
      const submission = this.payload[key];
      if (!submission) {
        console.log("No submission found for key");
        return;
      }
      console.log(submission.language);

      const strategy = createExecutor(submission.language);
      if (!strategy) {
        console.log("No strategy found for language");
        return;
      }
      const response: ExecutionResponse = await strategy.execute(
        submission.code,
        submission.inputCase,
      );
      if (response.status === "COMPLETED") {
        console.log("Execution completed successfully");
        console.log(response);
      } else {
        console.log("Execution failed with error");
        console.log(response);
      }
    }
  };
  failed = async (job?: Job): Promise<void> => {
    console.log(`The Job failed to execute`);
    console.log(job?.id);
    if (job) {
      console.log(job.id);
    }
  };
}
