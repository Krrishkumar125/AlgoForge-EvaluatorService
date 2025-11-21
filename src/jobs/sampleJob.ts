import type { Job } from "bullmq";

import type { IJob } from "../types/bullMqJobDefinition.js";

export default class SampleJob implements IJob {
  name: string;
  payload: Record<string, unknown>;
  constructor(payload: Record<string, unknown>) {
    this.payload = payload;
    this.name = this.constructor.name;
  }
  handle = (job?: Job) => {
    console.log("Handler of the job called");
    console.log(this.payload);
    if (job) {
      console.log(job.id, job.name, job.data);
    }
  };
  failed = (job?: Job): void => {
    console.log(`The Job failed to execute`);
    if (job) {
      console.log(job.id, job.name, job.data);
    }
  };
}
