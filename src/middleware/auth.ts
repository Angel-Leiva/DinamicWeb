import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt.ts';
import { getUserWithPermissions } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    uid: string;
    email: string;
    username: string;
    roleId: string;
    status: 'active' | 'inactive';
    permissions: string[];
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split('Bearer ')[1];
  } else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing authorization token' });
  }

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired access token' });
    }

    // Fetch user with full role/permission graph
    const userWithPerms = await getUserWithPermissions(decoded.uid);
    if (!userWithPerms) {
      return res.status(401).json({ error: 'Unauthorized: User record could not be established' });
    }

    if (userWithPerms.status !== 'active') {
      return res.status(403).json({ error: 'Forbidden: Your account is suspended or inactive' });
    }

    const permissionCodes = userWithPerms.role?.permissions?.map(
      (rp) => rp.permissionId
    ) || [];

    req.user = {
      id: userWithPerms.id,
      uid: userWithPerms.uid,
      email: userWithPerms.email,
      username: userWithPerms.username,
      roleId: userWithPerms.roleId,
      status: userWithPerms.status,
      permissions: permissionCodes,
    };

    next();
  } catch (error) {
    console.error('Error verifying token in auth middleware:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const requirePermission = (permissionCode: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    const hasPerm = req.user.permissions.includes(permissionCode);
    if (!hasPerm) {
      return res.status(403).json({
        error: `Forbidden: You do not have the required permission: ${permissionCode}`,
      });
    }

    next();
  };
};
