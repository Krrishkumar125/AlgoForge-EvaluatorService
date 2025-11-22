import express from "express";

import { addSubmission } from "../../controllers/submissionController.js";
import { createSubmissionZodSchema } from "../../dtos/createSubmissionDto.js";
import { validate } from "../../validators/createSubmissionValidator.js";

const submissionRouter = express.Router();

submissionRouter.post("/", validate(createSubmissionZodSchema), addSubmission);

export default submissionRouter;
