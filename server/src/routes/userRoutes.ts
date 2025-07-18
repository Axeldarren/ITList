import { Router } from "express";
import { createUser, getUserById, getUsers, updateUser, uploadProfilePicture } from "../controller/userController";
import upload from "../middleware/upload";
import { protect, restrictToAdmin } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.post("/", restrictToAdmin, createUser);

router.get("/", getUsers);
router.get("/:userId", getUserById);

router.patch("/:userId", updateUser);
router.post("/:userId/picture", upload.single('profilePicture'), uploadProfilePicture);

export default router;