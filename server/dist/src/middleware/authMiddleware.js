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
exports.restrictToAdmin = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        // --- THIS IS THE FIX ---
        // Check if req.cookies exists before trying to access a property on it.
    }
    else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        res.status(401).json({ message: 'You are not logged in! Please log in to get access.' });
        return;
    }
    try {
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Check if user still exists
        const currentUser = yield prisma.user.findUnique({ where: { userId: decoded.id } });
        if (!currentUser) {
            res.status(401).json({ message: 'The user belonging to this token does no longer exist.' });
            return;
        }
        // Grant access to protected route
        req.user = currentUser;
        next();
    }
    catch (err) {
        res.status(401).json({ message: 'Invalid token. Please log in again.' });
        return;
    }
});
exports.protect = protect;
const restrictToAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        // Add an explicit 'return' after sending the response
        res.status(403).json({ message: 'You do not have permission to perform this action.' });
        return;
    }
    next();
};
exports.restrictToAdmin = restrictToAdmin;
