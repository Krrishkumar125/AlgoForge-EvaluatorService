// import Docker from "dockerode";

// import type { TestCases } from "../types/testCases.js";
import type { Readable } from "stream";

import type CodeExecutorStrategy from "../types/codeExecutorStrategy.js";
import type { ExecutionResponse } from "../types/codeExecutorStrategy.js";
import { PYTHON_IMAGE } from "../utils/constants.js";
import createContainer from "./containerFactory.js";
import decodeDockerStream from "./dockerHelper.js";
import pullImage from "./pullImage.js";

class PythonExecutor implements CodeExecutorStrategy {
  async execute(
    code: string,
    inputTestCase: string,
    outputTestCase: string,
  ): Promise<ExecutionResponse> {
    console.log(code, inputTestCase, outputTestCase);

    const rawLogBuffer: Buffer[] = [];

    await pullImage(PYTHON_IMAGE);

    const runCommand = `echo '${code.replace(/'/g, `'\\"`)}' > test.py && echo '${inputTestCase.replace(/'/g, `'\\"`)}' | python3 test.py`;

    console.log(runCommand);
    const pythonDockerContainer = await createContainer(PYTHON_IMAGE, [
      "/bin/sh",
      "-c",
      runCommand,
    ]);

    //starting or booting the corresponding docker container
    await pythonDockerContainer.start();

    const loggerStream = (await pythonDockerContainer.logs({
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
      await pythonDockerContainer.remove();
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

export default PythonExecutor;
