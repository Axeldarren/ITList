import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { StringValue } from 'ms';
import validator from 'validator';

const prisma = new PrismaClient();

const signToken = (id: number) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in the environment variables.');
    }

    return jwt.sign({ id }, jwtSecret, {
        expiresIn: process.env.JWT_EXPIRES_IN as StringValue || '12h', // Default to 12 hours if not set
    });
};

const createSendToken = (user: { userId: number, username: string, email: string, isAdmin: boolean }, statusCode: number, res: Response) => {
    const token = signToken(user.userId);

    const cookieOptions = {
        expires: new Date(
            Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
    };

    res.cookie('jwt', token, cookieOptions);

    // Send secure response without sensitive data
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user: {
                userId: user.userId,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin
            },
        },
    });
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { email, password } = req.body;

        // Input validation and sanitization
        if (!email || !password) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Please provide email and password' 
            });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Please provide a valid email address' 
            });
        }

        // Validate password length and content
        if (password.length < 6 || password.length > 128) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Invalid credentials' 
            });
        }

        // Block common XSS patterns in password
        const xssPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /eval\s*\(/i,
            /document\./i,
            /window\./i,
            /<iframe/i,
            /<object/i,
            /<embed/i
        ];

        if (xssPatterns.some(pattern => pattern.test(password))) {
            console.warn(`[SECURITY ALERT] XSS attempt detected from IP: ${req.ip}`);
            return res.status(400).json({ 
                status: 'error',
                message: 'Invalid characters detected in password' 
            });
        }

        // Sanitize email input
        const sanitizedEmail = validator.normalizeEmail(email, {
            all_lowercase: true,
            gmail_remove_dots: false
        });

        if (!sanitizedEmail) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Invalid email format' 
            });
        }

        // Use parameterized query through Prisma (prevents SQL injection)
        const user = await prisma.user.findUnique({
            where: { email: sanitizedEmail },
            select: {
                userId: true,
                username: true,
                email: true,
                password: true,
                isAdmin: true
            }
        });

        // Use timing-safe comparison to prevent timing attacks
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ 
                status: 'error',
                message: 'Incorrect email or password' 
            });
        }

        // Create secure user object without password
        const secureUser = {
            userId: user.userId,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin
        };

        createSendToken(secureUser, 200, res);

    } catch (error) {
        console.error('Login error:', error);
        // Don't expose internal error details
        res.status(500).json({ 
            status: 'error',
            message: 'Internal server error. Please try again later.' 
        });
    }
};

export const logout = (req: Request, res: Response) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({ status: 'success' });
};

export const verify = (req: Request, res: Response) => {
    // If we get here, the protect middleware has already validated the token
    // and attached the user to the request
    res.status(200).json({
        status: 'success',
        message: 'Token is valid',
        user: req.user
    });
};