import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Rate limiting for login attempts
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        status: 'error',
        message: 'Too many login attempts. Please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

// Slow down repeated login attempts
export const loginSlowDown = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 2, // Allow 2 requests at normal speed
    delayMs: (hits) => hits * 1000, // Add 1 second per hit after delayAfter
    maxDelayMs: 10000, // Max 10 second delay
});

// General API rate limiting
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window per IP
    message: {
        status: 'error',
        message: 'Too many requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
