import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser, getUserWithPermissions } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    uid: string;
    email: string;
    username: string;
    roleId: string;
    status: 'active' | 'inactive';
    permissions: string[]; // List of permission codes e.g. ['pages:create', 'pages:publish']
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authorization header token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const email = decodedToken.email;
    const uid = decodedToken.uid;
    const name = decodedToken.name;

    if (!email) {
      return res.status(401).json({ error: 'Unauthorized: Email is required in auth token' });
    }

    // Sync the user with our SQL database
    const dbUser = await getOrCreateUser(uid, email, name);

    // Fetch the user with full role and permission associations
    const userWithPerms = await getUserWithPermissions(uid);

    if (!userWithPerms) {
      return res.status(401).json({ error: 'Unauthorized: User record could not be established' });
    }

    if (userWithPerms.status !== 'active') {
      return res.status(403).json({ error: 'Forbidden: Your account is suspended or inactive' });
    }

    // Map permission records to a simple list of string codes
    const permissionCodes = userWithPerms.role?.permissions?.map(
      (rp) => rp.permissionId
    ) || [];

    req.user = {
      id: dbUser.id,
      uid: dbUser.uid,
      email: dbUser.email,
      username: dbUser.username,
      roleId: dbUser.roleId,
      status: dbUser.status,
      permissions: permissionCodes,
    };

    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token or session expired' });
  }
};

// RBAC Permission Check Middleware
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
