import { Router } from "express";
import { getUserById, getUsers, updateUser, uploadProfilePicture } from "../controller/userController";
import upload from "../middleware/upload";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.get("/", getUsers);
router.get("/:userId", getUserById);

router.patch("/:userId", updateUser);
router.post("/:userId/picture", upload.single('profilePicture'), uploadProfilePicture);

export default router;