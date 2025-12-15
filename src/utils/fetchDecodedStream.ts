import { clearTimeout, setTimeout } from "node:timers";

import Docker from "dockerode";
import type { Readable } from "stream";

import decodeDockerStream from "../containers/dockerHelper.js";

export default async function fetchDecodedStream(
  loggerStream: Readable,
  rawLogBuffer: Buffer[],
  container: Docker.Container,
): Promise<string> {
  return await new Promise((resolve, reject) => {
    let isTimeout = false;

    const timeout = setTimeout(() => {
      isTimeout = true;
      console.log("Timeout reached, stopping container...");
      container.kill();
    }, 2000);

    loggerStream.on("end", () => {
      clearTimeout(timeout);

      // If timeout occurred, reject immediately
      if (isTimeout) {
        reject("Time Limit Exceeded");
        return;
      }

      const completeBuffer = Buffer.concat(rawLogBuffer);
      const decodedStream = decodeDockerStream(completeBuffer);
      if (decodedStream.stderr) {
        reject(decodedStream.stderr);
      } else {
        resolve(decodedStream.stdout);
      }
    });
  });
}
