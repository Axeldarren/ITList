import multer from "multer";

// Uses memory storage — no file ever touches the disk.
// This is required for Railway (ephemeral filesystem) and for piping directly to ImageKit.
const uploadImageMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
            cb(null, true);
        } else {
            cb(new Error("Only JPG/JPEG images are allowed."));
        }
    },
});

export default uploadImageMemory;
