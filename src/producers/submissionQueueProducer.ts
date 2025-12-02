import submissionQueue from "../queues/submissionQueue.js";

export default async function (payload: Record<string, unknown>) {
  await submissionQueue.add("SubmissionJob", payload);
}
