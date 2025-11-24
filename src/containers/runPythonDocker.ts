// import Docker from "dockerode";

// import type { TestCases } from "../types/testCases.js";
import { PYTHON_IMAGE } from "../utils/constants.js";
import createContainer from "./containerFactory.js";
import decodeDockerStream from "./dockerHelper.js";

async function runPython(code: string, inputTestCase: string) {
  const rawLogBuffer: Buffer[] = [];

  const runCommand = `echo '${code.replace(/'/g, `'\\"`)}' > test.py && echo '${inputTestCase.replace(/'/g, `'\\"`)}' | python3 test.py`;

  console.log(runCommand);
  const pythonDockerContainer = await createContainer(PYTHON_IMAGE, [
    "/bin/sh",
    "-c",
    runCommand,
  ]);

  //starting or booting the corresponding docker container
  await pythonDockerContainer.start();

  const loggerStream = await pythonDockerContainer.logs({
    stdout: true,
    stderr: true,
    timestamps: false,
    follow: true, // whether the logs are streamed or returned as a string
  });

  //attach events on the stream objects to start and stop reading

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

  //remove the container when done with it
  await pythonDockerContainer.remove();
}

export default runPython;
