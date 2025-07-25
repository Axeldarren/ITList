import { Router } from "express";
import { getTeams, createTeam, updateTeam, deleteTeam } from "../controller/teamController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.get("/", getTeams);
router.post("/", createTeam);
router.patch("/:teamId", updateTeam);
router.delete("/:teamId", deleteTeam);

export default router;