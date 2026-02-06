import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';

// XSS Protection middleware
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                // Clean any potential XSS attacks from string inputs
                req.body[key] = xss(req.body[key], {
                    whiteList: {}, // No HTML tags allowed
                    stripIgnoreTag: true,
                    stripIgnoreTagBody: ['script']
                });
            }
        }
    }
    next();
};

// NoSQL injection protection
export const noSQLProtection = mongoSanitize({
    replaceWith: '_'
});

// Login validation middleware
export const validateLoginEmail = body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 255 })
    .withMessage('Email is too long');

export const validateLoginPassword = body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]*$/)
    .withMessage('Password contains invalid characters');

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            status: 'error',
            message: 'Invalid input data',
            errors: errors.array()
        });
        return;
    }
    next();
};

// User creation validation middleware
export const validateUserCreation = [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_.-]+$/)
        .withMessage('Username can only contain letters, numbers, dots, hyphens, and underscores'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address')
        .isLength({ max: 255 })
        .withMessage('Email is too long'),
    
    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('NIK')
        .optional()
        .isNumeric()
        .withMessage('NIK must be a number'),
    
    body('role')
        .optional()
        .isString()
        .isIn(['ADMIN', 'DEVELOPER', 'BUSINESS_OWNER'])
        .withMessage('Role must be one of: ADMIN, DEVELOPER, BUSINESS_OWNER'),
    
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid input data',
                errors: errors.array()
            });
        }
        next();
    }
];

// Request logging middleware for security monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // Log suspicious patterns
    const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /eval\s*\(/i,
        /document\./i,
        /window\./i
    ];
    
    const requestBody = JSON.stringify(req.body);
    const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(requestBody));
    
    if (hasSuspiciousContent) {
        console.warn(`[SECURITY WARNING] ${timestamp} - Suspicious request from IP: ${ip}`);
        console.warn(`User-Agent: ${userAgent}`);
        console.warn(`Request Body: ${requestBody}`);
        console.warn(`URL: ${req.method} ${req.originalUrl}`);
    }
    
    next();
};
