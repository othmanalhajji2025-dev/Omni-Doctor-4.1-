import { Request, Response, NextFunction } from 'express';
import { userDataStore } from '../db/userDataStore.js';
import { UserRecord, UserRole } from '../db/schema.js';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.headers['x-session-token'] as string);

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_TOKEN_MISSING',
      messageAr: 'يرجى تسجيل الدخول للوصول إلى هذا السجل الطبي',
    });
  }

  const user = userDataStore.validateSession(token);
  if (!user) {
    return res.status(401).json({
      error: 'Invalid or expired session token',
      code: 'AUTH_TOKEN_INVALID',
      messageAr: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً',
    });
  }

  req.user = user;
  next();
}

// Optional Auth (for guest encounters or endpoints that adapt to logged-in status)
export function optionalAuthenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.headers['x-session-token'] as string);

  if (token) {
    const user = userDataStore.validateSession(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

// Role-Based Access Control (RBAC) Guard
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access forbidden: Insufficient clinical permissions',
        code: 'FORBIDDEN_ROLE',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
        messageAr: 'ليس لديك الصلاحيات السريرية أو الإدارية الكافية للوصول لهذا الإجراء',
      });
    }

    next();
  };
}
