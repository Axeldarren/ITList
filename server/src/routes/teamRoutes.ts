import { Router } from "express";
import { getTeams, createTeam, updateTeam, deleteTeam } from "../controller/teamController";

const router = Router();

router.get("/", getTeams);
router.post("/", createTeam);
router.patch("/:teamId", updateTeam);
router.delete("/:teamId", deleteTeam);

export default router;