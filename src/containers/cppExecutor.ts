// import Docker from "dockerode";

// import type { TestCases } from "../types/testCases.js";
import type { Readable } from "stream";

import type { ExecutionResponse } from "../types/codeExecutorStrategy.js";
import type CodeExecutorStrategy from "../types/codeExecutorStrategy.js";
import { CPP_IMAGE } from "../utils/constants.js";
import createContainer from "./containerFactory.js";
import decodeDockerStream from "./dockerHelper.js";
import pullImage from "./pullImage.js";

class CppExecutor implements CodeExecutorStrategy {
  async execute(
    code: string,
    inputTestCase: string,
  ): Promise<ExecutionResponse> {
    const rawLogBuffer: Buffer[] = [];

    await pullImage(CPP_IMAGE);

    const runCommand = `echo '${code.replace(/'/g, `'\\"`)}' > main.cpp && g++ main.cpp -o main && echo '${inputTestCase.replace(/'/g, `'\\"`)}' | ./main`;

    console.log(runCommand);
    const cppDockerContainer = await createContainer(CPP_IMAGE, [
      "/bin/sh",
      "-c",
      runCommand,
    ]);

    await cppDockerContainer.start();

    const loggerStream = (await cppDockerContainer.logs({
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
      await cppDockerContainer.remove();
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

export default CppExecutor;
