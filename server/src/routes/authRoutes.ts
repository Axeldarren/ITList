import { Router, Request, Response, NextFunction } from 'express';
import { login, logout, verify } from '../controller/authController';
import { protect } from '../middleware/authMiddleware';
import { loginLimiter, loginSlowDown } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiting to login route (validation is now in the controller)
router.post('/login', 
  loginSlowDown, 
  loginLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    login(req, res, next);
  }
);
router.get('/logout', (req: Request, res: Response, next: NextFunction) => {
  logout(req, res);
});
router.get('/verify', protect, (req: Request, res: Response, next: NextFunction) => {
  verify(req, res);
});

export default router;