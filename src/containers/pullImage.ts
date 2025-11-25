import Docker from "dockerode";
import { Readable } from "stream";

async function pullImage(imageName: string) {
  try {
    const docker = new Docker();
    return new Promise((res, rej) => {
      docker.pull(imageName, (err: Error, stream: Readable) => {
        if (err) throw err;
        docker.modem.followProgress(
          stream,
          (err, response) => (err ? rej(err) : res(response)),
          (event) => {
            console.log(event.status);
          },
        );
      });
    });
  } catch (error) {
    console.log(error);
  }
}

export default pullImage;
