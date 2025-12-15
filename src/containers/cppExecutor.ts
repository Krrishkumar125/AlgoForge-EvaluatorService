import type { Readable } from "stream";

import type { ExecutionResponse } from "../types/codeExecutorStrategy.js";
import type CodeExecutorStrategy from "../types/codeExecutorStrategy.js";
import { CPP_IMAGE } from "../utils/constants.js";
import fetchDecodedStream from "../utils/fetchDecodedStream.js";
import createContainer from "./containerFactory.js";
import pullImage from "./pullImage.js";

class CppExecutor implements CodeExecutorStrategy {
  async execute(
    code: string,
    inputTestCase: string,
    outputTestCase: string,
  ): Promise<ExecutionResponse> {
    const rawLogBuffer: Buffer[] = [];

    await pullImage(CPP_IMAGE);

    const runCommand = `echo '${code.replace(/'/g, `'\\"`)}' > main.cpp && g++ main.cpp -o main && echo '${inputTestCase.replace(/'/g, `'\\"`)}' | ./main`;

    console.log("The runCommand", runCommand);
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

    loggerStream.on("data", (chunk) => {
      rawLogBuffer.push(chunk);
    });

    try {
      const codeResponse = await fetchDecodedStream(
        loggerStream,
        rawLogBuffer,
        cppDockerContainer,
      );
      if (codeResponse.trim() === outputTestCase.trim()) {
        return { output: codeResponse, status: "SUCCESS" };
      } else {
        return { output: codeResponse, status: "WRONG ANSWER" };
      }
    } catch (error) {
      if (error === "Time Limit Exceeded") {
        return { output: "", status: "Time Limit Exceeded" };
      }
      return { output: error as string, status: "ERROR" };
    } finally {
      await cppDockerContainer.remove();
    }
  }
}

export default CppExecutor;
