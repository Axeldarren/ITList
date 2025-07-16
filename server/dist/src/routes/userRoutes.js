"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controller/userController");
const upload_1 = __importDefault(require("../middleware/upload"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.protect);
router.get("/", userController_1.getUsers);
router.get("/:userId", userController_1.getUserById);
router.patch("/:userId", userController_1.updateUser);
router.post("/:userId/picture", upload_1.default.single('profilePicture'), userController_1.uploadProfilePicture);
exports.default = router;
