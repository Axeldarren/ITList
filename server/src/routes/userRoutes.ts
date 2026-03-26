import { Router } from "express";
import { createUser, deleteUser, getUserById, getUsers, updateUser, uploadProfilePicture, getUserWeeklyStats, getDeveloperAssignments, changePassword } from "../controller/userController";
import uploadImageMemory from "../middleware/uploadImageMemory";
import { protect, restrictToAdmin } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.post("/", restrictToAdmin, createUser);

router.get("/", getUsers);
router.get("/assignments", restrictToAdmin, getDeveloperAssignments);
router.get("/:userId", getUserById);
router.get("/:userId/weekly-stats", getUserWeeklyStats);

router.patch("/:userId/password", changePassword);
router.patch("/:userId", updateUser);
router.post("/:userId/picture", uploadImageMemory.single('profilePicture'), uploadProfilePicture);

router.delete("/:userId", restrictToAdmin, deleteUser);

export default router;