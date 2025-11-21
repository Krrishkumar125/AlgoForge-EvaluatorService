import express from "express";

import { pingCheck } from "../../controllers/index.js";

const v1Router = express.Router();

v1Router.get("/", () => {});

v1Router.get("/ping", pingCheck);

export default v1Router;
