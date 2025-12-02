import type { Job } from "bullmq";

import runPython from "../containers/runPythonDocker.js";
import type { IJob } from "../types/bullMqJobDefinition.js";
import type { SubmissionPayload } from "../types/submissionPayload.js";

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

      if (submission.language === "python") {
        console.log("Handle Python specific failure");
        const response = await runPython(submission.code, submission.inputCase);
        console.log("Evaluated response is ", response);
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
