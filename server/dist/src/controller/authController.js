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
exports.logout = exports.login = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const signToken = (id) => {
    // --- THIS IS THE FIX ---
    // We must ensure the JWT_SECRET is not undefined before using it.
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in the environment variables.');
    }
    return jsonwebtoken_1.default.sign({ id }, jwtSecret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '12h', // Default to 12 hours if not set
    });
};
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user.id);
    const cookieOptions = {
        expires: new Date(Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };
    res.cookie('jwt', token, cookieOptions);
    // Remove password from output
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }
        const user = yield prisma.user.findUnique({
            where: { email },
        });
        // // --- START DEBUGGING LOGS ---
        // console.log('--- LOGIN ATTEMPT ---');
        // console.log('Password from Postman:', password);
        // console.log('User found in DB:', user); // See if the user is found
        // if (user) {
        //     console.log('Hashed Password from DB:', user.password);
        //     const isMatch = await bcrypt.compare(password, user.password);
        //     console.log('Does password match?', isMatch);
        // }
        // console.log('--------------------');
        // // --- END DEBUGGING LOGS ---
        if (!user || !(yield bcryptjs_1.default.compare(password, user.password))) {
            return res.status(401).json({ message: 'Incorrect email or password' });
        }
        createSendToken({ id: user.userId, password: user.password }, 200, res);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: 'Error logging in', error: errorMessage });
    }
});
exports.login = login;
const logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({ status: 'success' });
};
exports.logout = logout;
