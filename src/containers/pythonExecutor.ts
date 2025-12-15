import type { Readable } from "stream";

import type CodeExecutorStrategy from "../types/codeExecutorStrategy.js";
import type { ExecutionResponse } from "../types/codeExecutorStrategy.js";
import { PYTHON_IMAGE } from "../utils/constants.js";
import fetchDecodedStream from "../utils/fetchDecodedStream.js";
import createContainer from "./containerFactory.js";
import pullImage from "./pullImage.js";

class PythonExecutor implements CodeExecutorStrategy {
  async execute(
    code: string,
    inputTestCase: string,
    outputTestCase: string,
  ): Promise<ExecutionResponse> {
    const rawLogBuffer: Buffer[] = [];

    await pullImage(PYTHON_IMAGE);

    const runCommand = `echo '${code.replace(/'/g, `'\\"`)}' > test.py && echo '${inputTestCase.replace(/'/g, `'\\"`)}' | python3 test.py`;

    console.log("The runCommand", runCommand);
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
      const codeResponse = await fetchDecodedStream(
        loggerStream,
        rawLogBuffer,
        pythonDockerContainer,
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
      await pythonDockerContainer.remove();
    }
  }
}

export default PythonExecutor;
