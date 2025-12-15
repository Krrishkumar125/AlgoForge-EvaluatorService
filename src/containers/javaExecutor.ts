import type { Readable } from "stream";

import type { ExecutionResponse } from "../types/codeExecutorStrategy.js";
import type CodeExecutorStrategy from "../types/codeExecutorStrategy.js";
import { JAVA_IMAGE } from "../utils/constants.js";
import fetchDecodedStream from "../utils/fetchDecodedStream.js";
import createContainer from "./containerFactory.js";
import pullImage from "./pullImage.js";

class JavaExecutor implements CodeExecutorStrategy {
  async execute(
    code: string,
    inputTestCase: string,
    outputTestCase: string,
  ): Promise<ExecutionResponse> {
    const rawLogBuffer: Buffer[] = [];

    await pullImage(JAVA_IMAGE);

    const runCommand = `echo '${code.replace(/'/g, `'\\"`)}' > Main.java && javac Main.java && echo '${inputTestCase.replace(/'/g, `'\\"`)}' | java Main`;

    console.log("The runCommand", runCommand);
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
      const codeResponse = await fetchDecodedStream(
        loggerStream,
        rawLogBuffer,
        javaDockerContainer,
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
      await javaDockerContainer.remove();
    }
  }
}

export default JavaExecutor;
