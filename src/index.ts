import express from "express";

import bullBoardAdapter from "./config/bullBoardConfig.js";
import logger from "./config/loggerConfig.js";
import serverConfig from "./config/serverConfig.js";
import sampleQueueProducer from "./producers/sampleQueueProducer.js";
import apiRouter from "./routes/index.js";
import sampleWorker from "./workers/sampleWorker.js";

const app = express();

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

  sampleQueueProducer(
    "SampleJob",
    {
      name: "Krrish",
      company: "NA",
      position: "Backend Dev",
      location: "Remote | BLR",
    },
    1,
  );
  sampleQueueProducer(
    "SampleJob",
    {
      name: "Aman",
      company: "NA",
      position: "Frontend Dev",
      location: "BLR",
    },
    1,
  );
});
