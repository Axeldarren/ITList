import { Router } from "express";
import { getAllTimeLogs, getRunningTimeLog, startTimer, stopTimer } from "../controller/timeLogController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.post("/start", startTimer);
router.post("/stop", stopTimer);
router.get("/", getAllTimeLogs);
router.get("/running", getRunningTimeLog);

export default router;