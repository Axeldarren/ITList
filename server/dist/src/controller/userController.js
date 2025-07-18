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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = exports.uploadProfilePicture = exports.updateUser = exports.getUserById = exports.getUsers = void 0;
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
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
    const loggedInUser = req.user;
    const { username, email, NIK, isAdmin } = req.body;
    if (!loggedInUser) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }
    try {
        const dataToUpdate = {
            username,
            email,
            NIK: NIK ? Number(NIK) : undefined,
        };
        // --- THIS IS THE FIX ---
        // Securely handle the isAdmin flag
        if (loggedInUser.isAdmin) {
            // Only an admin can change the isAdmin status
            if (typeof isAdmin === 'boolean') {
                dataToUpdate.isAdmin = isAdmin;
            }
        }
        else if (isAdmin === true && !loggedInUser.isAdmin) {
            // A non-admin cannot make themselves an admin
            res.status(403).json({ message: 'You do not have permission to change admin status.' });
            return;
        }
        const updatedUser = yield prisma.user.update({
            where: { userId: Number(userId) },
            data: dataToUpdate,
        });
        // Ensure the password is not sent back to the client
        const { password } = updatedUser, userWithoutPassword = __rest(updatedUser, ["password"]);
        res.status(200).json(userWithoutPassword);
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
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, NIK, isAdmin } = req.body;
    if (!username || !email || !password) {
        res.status(400).json({ message: 'Username, email, and password are required.' });
        return;
    }
    try {
        // Hash the password before saving
        const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
        const newUser = yield prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                NIK: NIK ? Number(NIK) : 0,
                isAdmin: isAdmin || false,
            },
        });
        // Remove password from the returned object
        const { password: _ } = newUser, userWithoutPassword = __rest(newUser, ["password"]);
        res.status(201).json(userWithoutPassword);
    }
    catch (error) {
        if (error.code === 'P2002') { // Handle unique constraint errors (e.g., email already exists)
            res.status(409).json({ message: 'A user with this email or username already exists.' });
        }
        else {
            res.status(500).json({ message: 'Error creating user', error: error.message });
        }
    }
});
exports.createUser = createUser;
