import { Router } from "express";
import { createUser, deleteUser, getUserById, getUsers, updateUser, uploadProfilePicture } from "../controller/userController";
import upload from "../middleware/upload";
import { protect, restrictToAdmin } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.post("/", restrictToAdmin, createUser);

router.get("/", getUsers);
router.get("/:userId", getUserById);

router.patch("/:userId", updateUser);
router.post("/:userId/picture", upload.single('profilePicture'), uploadProfilePicture);

router.delete("/:userId", restrictToAdmin, deleteUser);

export default router;