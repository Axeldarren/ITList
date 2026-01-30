import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

// Extend the Express Request type to include the user
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        res.status(401).json({ message: 'You are not logged in! Please log in to get access.' });
        return;
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

        // Check if user still exists
        const currentUser = await prisma.user.findUnique({ where: { userId: decoded.id } });
        if (!currentUser) {
            res.status(401).json({ message: 'The user belonging to this token does no longer exist.' });
            return;
        }

        // Grant access to protected route
        req.user = currentUser;
        next();
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            res.status(401).json({ message: 'Your session has expired. Please log in again.', code: 'TOKEN_EXPIRED' });
        } else {
            res.status(401).json({ message: 'Invalid token. Please log in again.' });
        }
        return;
    }
};

export const restrictToAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.isAdmin) {
        // Add an explicit 'return' after sending the response
        res.status(403).json({ message: 'You do not have permission to perform this action.' });
        return;
    }
    next();
};

