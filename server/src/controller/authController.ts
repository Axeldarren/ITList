import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { StringValue } from 'ms';

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

const createSendToken = (user: { userId: number, password?: string }, statusCode: number, res: Response) => {
    const token = signToken(user.userId);

    const cookieOptions = {
        expires: new Date(
            Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
        ),
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

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const user = await prisma.user.findUnique({
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

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Incorrect email or password' });
        }

        createSendToken({ userId: user.userId, password: user.password }, 200, res);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: 'Error logging in', error: errorMessage });
    }
};

export const logout = (req: Request, res: Response) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({ status: 'success' });
};