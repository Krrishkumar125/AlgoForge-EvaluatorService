import bodyParser from "body-parser";
import express from "express";

import bullBoardAdapter from "./config/bullBoardConfig.js";
import logger from "./config/loggerConfig.js";
import serverConfig from "./config/serverConfig.js";
import runJava from "./containers/runJavaDocker.js";
// import runPython from "./containers/runPythonDocker.js";
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

  //   const codePython = `x = input()
  // y = input()
  // print(int(x) + int(y))`;

  const codeJava = `
  import java.util.*;
  public class Main{
   public static void main(String[] args){
      Scanner scn = new Scanner(System.in);
      int x = scn.nextInt();
      int y = scn.nextInt();
      System.out.println("1st input value given by user: " + x);
      System.out.println("2nd input value given by user: " + y);
      for(int i = 0; i< x; i++){
         System.out.println(i);
      }
   }
  }
  `;

  const inputCase = `100
200`;
  // runPython(codePython, inputCase);

  runJava(codeJava, inputCase);
});
