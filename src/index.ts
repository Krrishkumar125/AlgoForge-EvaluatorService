import express from "express";

import serverConfig from "./config/serverConfig.js";
import apiRouter from "./routes/index.js";

const app = express();

app.use("/api", apiRouter);

app.listen(serverConfig.PORT, () => {
  console.log(`Server is running on port ${serverConfig.PORT}`);
});
