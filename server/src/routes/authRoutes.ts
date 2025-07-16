import { Router, Request, Response, NextFunction } from 'express';
import { login, logout } from '../controller/authController';

const router = Router();

router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  login(req, res, next);
});
router.get('/logout', (req: Request, res: Response, next: NextFunction) => {
  logout(req, res);
});

export default router;