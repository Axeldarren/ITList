"use strict";
// server/src/routes/commentRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commentController_1 = require("../controller/commentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.protect);
router.post("/", (req, res, next) => {
    Promise.resolve((0, commentController_1.createComment)(req, res)).catch(next);
});
router.patch("/:commentId", (req, res, next) => {
    Promise.resolve((0, commentController_1.updateComment)(req, res)).catch(next);
});
router.delete("/:commentId", (req, res, next) => {
    Promise.resolve((0, commentController_1.deleteComment)(req, res)).catch(next);
});
exports.default = router;
