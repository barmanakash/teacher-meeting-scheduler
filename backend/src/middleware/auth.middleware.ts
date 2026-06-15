import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.model';

export interface AuthRequest extends Request {
  user?: IUser;
}

type AuthHandler = (req: AuthRequest, res: Response, next: NextFunction) => Promise<void> | void;

export const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const token = (req as any).cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    (req as AuthRequest).user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const requireTeacher: RequestHandler = (req, res, next) => {
  const user = (req as AuthRequest).user;
  if (user?.role !== 'teacher') {
    res.status(403).json({ success: false, message: 'Teacher access required' });
    return;
  }
  next();
};

export const requireCandidate: RequestHandler = (req, res, next) => {
  const user = (req as AuthRequest).user;
  if (user?.role !== 'candidate') {
    res.status(403).json({ success: false, message: 'Candidate access required' });
    return;
  }
  next();
};
