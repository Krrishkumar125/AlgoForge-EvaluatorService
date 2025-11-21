import { Redis } from "ioredis";

import ServerConfig from "./serverConfig.js";

const redisConfig = {
  port: Number(ServerConfig.REDIS_PORT),
  host: ServerConfig.REDIS_HOST,
  maxRetriesPerRequest: null,
};

const redisConnection = new Redis(redisConfig);

export default redisConnection;
