import type { Request, Response } from "express";

export const pingCheck = (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Ping check okay",
  });
};
