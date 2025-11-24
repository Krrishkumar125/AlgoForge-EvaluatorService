// import Docker from "dockerode";

// import type { TestCases } from "../types/testCases.js";
import { JAVA_IMAGE } from "../utils/constants.js";
import createContainer from "./containerFactory.js";
import decodeDockerStream from "./dockerHelper.js";

async function runJava(code: string, inputTestCase: string) {
  const rawLogBuffer: Buffer[] = [];

  const runCommand = `echo '${code.replace(/'/g, `'\\"`)}' > Main.java && javac Main.java && echo '${inputTestCase.replace(/'/g, `'\\"`)}' | java Main`;

  console.log(runCommand);
  const javaDockerContainer = await createContainer(JAVA_IMAGE, [
    "/bin/sh",
    "-c",
    runCommand,
  ]);

  await javaDockerContainer.start();

  const loggerStream = await javaDockerContainer.logs({
    stdout: true,
    stderr: true,
    timestamps: false,
    follow: true,
  });

  loggerStream.on("data", (chunk) => {
    rawLogBuffer.push(chunk);
  });

  await new Promise((resolve) => {
    loggerStream.on("end", () => {
      const completeBuffer = Buffer.concat(rawLogBuffer);
      const decodedStream = decodeDockerStream(completeBuffer);
      console.log(decodedStream.stdout);
      console.log(decodedStream);
      resolve(decodedStream);
    });
  });

  await javaDockerContainer.remove();
}

export default runJava;
