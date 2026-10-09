import { Router, type IRouter } from "express";
import healthRouter from "./health";
import publicAssessmentsRouter from "./public-assessments";
import recruitmentRouter from "./recruitment";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicAssessmentsRouter);
router.use(recruitmentRouter);

export default router;
