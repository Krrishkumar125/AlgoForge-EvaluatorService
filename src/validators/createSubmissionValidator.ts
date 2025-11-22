import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export const validate =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (schema: ZodSchema<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
      try {
        schema.parse({
          ...req.body,
        });

        next();
      } catch (error) {
        console.log(error);
        return res.status(400).json({
          success: false,
          message: "Invalid request params recieved",
          err: error,
          data: {},
        });
      }
    };
