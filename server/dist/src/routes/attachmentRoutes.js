"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attachmentController_1 = require("../controller/attachmentController");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = (0, express_1.Router)();
// This route uses the multer middleware to handle a single file upload
router.post("/", upload_1.default.single('file'), (req, res, next) => {
    Promise.resolve((0, attachmentController_1.createAttachment)(req, res)).catch(next);
});
// Delete Attachment by ID
router.delete("/:attachmentId", (req, res, next) => {
    Promise.resolve((0, attachmentController_1.deleteAttachment)(req, res)).catch(next);
});
exports.default = router;
