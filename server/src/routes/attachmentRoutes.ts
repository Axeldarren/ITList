import { Router } from 'express';
import { createAttachment, deleteAttachment } from '../controller/attachmentController';
import upload from '../middleware/upload';

const router = Router();

// This route uses the multer middleware to handle a single file upload
router.post("/", upload.single('file'), (req, res, next) => {
	Promise.resolve(createAttachment(req, res)).catch(next);
});

// Delete Attachment by ID
router.delete("/:attachmentId", (req, res, next) => {
	Promise.resolve(deleteAttachment(req, res)).catch(next);
});

export default router;