import { Router } from "express";
import { getAllTimeLogs, startTimer, stopTimer } from "../controller/timeLogController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.post("/start", startTimer);
router.post("/stop", stopTimer);
router.get("/", getAllTimeLogs);

export default router;