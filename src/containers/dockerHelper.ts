import type DockerStreamOutput from "../types/dockerStreamOutput.js";
import { DOCKER_STREAM_HEADER_SIZE } from "../utils/constants.js";

export default function decodeDockerStream(buffer: Buffer): DockerStreamOutput {
  let offset = 0; //variable will keep track of the curr position in the buffer while parsing

  // output that will store the accumulated stdout,stderr as strings
  const output: DockerStreamOutput = { stdout: "", stderr: "" };

  // loop until offset reaches end of the buffer
  while (offset < buffer.length) {
    // channel is read from buffer and has value of type of stream
    const typeofStream = buffer[offset];

    //length variable holds the length of the value
    // we will read this variable on an offset of 4 bytes from the start of the chunk
    const length = buffer.readUint32BE(offset + 4);

    //as now we have read the header we will move forward to the value of the chunk
    offset += DOCKER_STREAM_HEADER_SIZE;
    if (typeofStream === 1) {
      //stdout stream
      output.stdout += buffer.toString("utf-8", offset, offset + length);
    } else if (typeofStream === 2) {
      //stderr stream
      output.stderr += buffer.toString("utf-8", offset, offset + length);
    }

    offset += length; //move offset to next chunk
  }

  return output;
}
