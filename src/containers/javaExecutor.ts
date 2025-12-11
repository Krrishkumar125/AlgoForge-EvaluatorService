// import Docker from "dockerode";

// import type { TestCases } from "../types/testCases.js";
import type { Readable } from "stream";

import type { ExecutionResponse } from "../types/codeExecutorStrategy.js";
import type CodeExecutorStrategy from "../types/codeExecutorStrategy.js";
import { JAVA_IMAGE } from "../utils/constants.js";
import createContainer from "./containerFactory.js";
import decodeDockerStream from "./dockerHelper.js";
import pullImage from "./pullImage.js";

class JavaExecutor implements CodeExecutorStrategy {
  async execute(
    code: string,
    inputTestCase: string,
  ): Promise<ExecutionResponse> {
    const rawLogBuffer: Buffer[] = [];

    await pullImage(JAVA_IMAGE);

    const runCommand = `echo '${code.replace(/'/g, `'\\"`)}' > Main.java && javac Main.java && echo '${inputTestCase.replace(/'/g, `'\\"`)}' | java Main`;

    console.log(runCommand);
    const javaDockerContainer = await createContainer(JAVA_IMAGE, [
      "/bin/sh",
      "-c",
      runCommand,
    ]);

    await javaDockerContainer.start();

    const loggerStream = (await javaDockerContainer.logs({
      stdout: true,
      stderr: true,
      timestamps: false,
      follow: true, // whether the logs are streamed or returned as a string
    })) as Readable;

    //attach events on the stream objects to start and stop reading

    loggerStream.on("data", (chunk) => {
      rawLogBuffer.push(chunk);
    });

    try {
      const codeResponse = await this.fetchDecodedStream(
        loggerStream,
        rawLogBuffer,
      );
      return { output: codeResponse, status: "COMPLETED" };
    } catch (error) {
      return { output: error as string, status: "ERROR" };
    } finally {
      await javaDockerContainer.remove();
    }
  }
  async fetchDecodedStream(
    loggerStream: Readable,
    rawLogBuffer: Buffer[],
  ): Promise<string> {
    return await new Promise((resolve, reject) => {
      loggerStream.on("end", () => {
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
}

export default JavaExecutor;
