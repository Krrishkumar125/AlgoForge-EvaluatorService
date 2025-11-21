import winston from "winston";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) log += `\n${stack}`;
    if (Object.keys(meta).length > 0)
      log += `\n${JSON.stringify(meta, null, 2)}`;
    return log;
  }),
);

const fileFormat = combine(timestamp(), errors({ stack: true }), json());

const allowedTransports: winston.transport[] = [];

if (process.env.NODE_ENV !== "production") {
  allowedTransports.push(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
} else {
  allowedTransports.push(
    new winston.transports.Console({
      format: fileFormat,
    }),
  );
}

allowedTransports.push(
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
    format: fileFormat,
    maxsize: Number(process.env.LOG_FILE_SIZE) || 5242880,
    maxFiles: Number(process.env.LOG_FILE_COUNT) || 5,
  }),
);

allowedTransports.push(
  new winston.transports.File({
    filename: "logs/combined.log",
    format: fileFormat,
    maxsize: Number(process.env.LOG_FILE_SIZE) || 5242880,
    maxFiles: Number(process.env.LOG_FILE_COUNT) || 5,
  }),
);

const logger = winston.createLogger({
  transports: allowedTransports,
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
});

export default logger;
