"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfilePicture = exports.updateUser = exports.getUserById = exports.getUsers = void 0;
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany();
        res.json(users);
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getUsers = getUsers;
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
        });
        if (user) {
            res.json(user);
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getUserById = getUserById;
// --- Function to update user profile information ---
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    // Only handles text-based fields
    const { username, email, NIK } = req.body;
    try {
        const updatedUser = yield prisma.user.update({
            where: { userId: Number(userId) },
            data: {
                username,
                email,
                NIK: NIK ? Number(NIK) : undefined
            },
        });
        res.status(200).json(updatedUser);
    }
    catch (error) {
        if (error.code === 'P2002') {
            res.status(409).json({ message: 'Username or email already in use.' });
        }
        else {
            res.status(500).json({ message: 'Error updating user', error: error.message });
        }
    }
});
exports.updateUser = updateUser;
// --- NEW: Function to handle profile picture upload ---
const uploadProfilePicture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    if (!req.file) {
        res.status(400).json({ message: 'No file uploaded.' });
        return;
    }
    try {
        // Find the user to get the old profile picture URL
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
        });
        // The URL path where the new file is accessible
        const profilePictureUrl = `/uploads/${req.file.filename}`;
        // Update the user with the new profile picture URL
        const updatedUser = yield prisma.user.update({
            where: { userId: Number(userId) },
            data: { profilePictureUrl },
        });
        // Delete the old profile picture file if it exists and is not null
        if (user === null || user === void 0 ? void 0 : user.profilePictureUrl) {
            const oldFilePath = path_1.default.join(__dirname, '..', '..', 'public', user.profilePictureUrl);
            fs_1.default.unlink(oldFilePath, (err) => {
                // Ignore error if file does not exist
            });
        }
        res.status(200).json(updatedUser);
    }
    catch (error) {
        res.status(500).json({ message: 'Error uploading profile picture.' });
    }
});
exports.uploadProfilePicture = uploadProfilePicture;
