// server/src/routes/commentRoutes.ts

import { Router } from "express";
import { createComment, updateComment, deleteComment } from "../controller/commentController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.post("/", (req, res, next) => {
    Promise.resolve(createComment(req, res)).catch(next);
});
router.patch("/:commentId", (req, res, next) => {
    Promise.resolve(updateComment(req, res)).catch(next);
});
router.delete("/:commentId", (req, res, next) => {
    Promise.resolve(deleteComment(req, res)).catch(next);
});

export default router;