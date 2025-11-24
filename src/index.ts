import bodyParser from "body-parser";
import express from "express";

import bullBoardAdapter from "./config/bullBoardConfig.js";
import logger from "./config/loggerConfig.js";
import serverConfig from "./config/serverConfig.js";
import runPython from "./containers/runPythonDocker.js";
import apiRouter from "./routes/index.js";
import sampleWorker from "./workers/sampleWorker.js";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api", apiRouter);
app.use("/ui", bullBoardAdapter.getRouter());

app.listen(serverConfig.PORT, () => {
  logger.info(
    `Server is running on port ${serverConfig.PORT} in ${process.env.NODE_ENV} mode.`,
  );

  logger.info(
    `Bull Board is available at http://localhost:${serverConfig.PORT}/ui`,
  );

  sampleWorker("SampleQueue");

  const code = `print("Hello, World!")`;

  runPython(code, "100");
});
