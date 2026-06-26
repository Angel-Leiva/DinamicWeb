import { db } from '../index.ts';
import { users, refreshTokens } from '../schema.ts';
import { eq, and, or, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../../lib/jwt.ts';
import { getUserWithPermissions } from '../users.ts';

export async function loginUser(emailOrUsername: string, password: any) {
  if (!emailOrUsername || !password) {
    throw new Error('Email/Username and password are required.');
  }

  // Find user by email or username
  const result = await db.select()
    .from(users)
    .where(
      or(
        eq(users.email, emailOrUsername),
        eq(users.username, emailOrUsername)
      )
    )
    .limit(1);

  const user = result[0];
  if (!user) {
    throw new Error('Credenciales inválidas.');
  }

  if (user.status !== 'active') {
    throw new Error('Su cuenta está suspendida o inactiva.');
  }

  // If no passwordHash is set yet, we check if they are trying to log in
  // with the default password for initial setup/migration
  if (!user.passwordHash) {
    throw new Error('Su cuenta no tiene una contraseña configurada.');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Credenciales inválidas.');
  }

  // Generate tokens
  const payload = { uid: user.uid, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token with a standard 7-day expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt,
  });

  const fullUser = await getUserWithPermissions(user.uid);

  return {
    user: {
      id: user.id,
      uid: user.uid,
      email: user.email,
      username: user.username,
      roleId: user.roleId,
      status: user.status,
      permissions: fullUser?.role?.permissions?.map(p => p.permissionId) || [],
    },
    accessToken,
    refreshToken,
  };
}

export async function logoutUser(refreshToken: string) {
  if (!refreshToken) return;
  // Remove token from database
  await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
}

export async function refreshUserSession(token: string) {
  if (!token) {
    throw new Error('Refresh token is required.');
  }

  // Verify token
  const decoded = verifyRefreshToken(token);
  if (!decoded) {
    throw new Error('Token de sesión inválido o expirado.');
  }

  // Verify against database
  const result = await db.select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token))
    .limit(1);

  const storedToken = result[0];
  if (!storedToken) {
    throw new Error('Sesión no encontrada o ya revocada.');
  }

  // Check if token has expired
  if (new Date() > new Date(storedToken.expiresAt)) {
    // Clean up expired token
    await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));
    throw new Error('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
  }

  const userResult = await db.select()
    .from(users)
    .where(eq(users.id, storedToken.userId))
    .limit(1);

  const user = userResult[0];
  if (!user || user.status !== 'active') {
    throw new Error('Usuario no encontrado o inactivo.');
  }

  // Generate a new set of tokens (Token Rotation!)
  const payload = { uid: user.uid, email: user.email };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  // Delete the old refresh token & insert the new one
  await db.transaction(async (tx) => {
    await tx.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await tx.insert(refreshTokens).values({
      userId: user.id,
      token: newRefreshToken,
      expiresAt,
    });
  });

  const fullUser = await getUserWithPermissions(user.uid);

  return {
    user: {
      id: user.id,
      uid: user.uid,
      email: user.email,
      username: user.username,
      roleId: user.roleId,
      status: user.status,
      permissions: fullUser?.role?.permissions?.map(p => p.permissionId) || [],
    },
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function changeUserPassword(uid: string, currentPassword: any, newPassword: any) {
  if (!uid || !currentPassword || !newPassword) {
    throw new Error('Todos los campos son requeridos.');
  }

  const result = await db.select()
    .from(users)
    .where(eq(users.uid, uid))
    .limit(1);

  const user = result[0];
  if (!user) {
    throw new Error('Usuario no encontrado.');
  }

  if (!user.passwordHash) {
    throw new Error('Su cuenta no tiene contraseña configurada.');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new Error('La contraseña actual es incorrecta.');
  }

  const salt = await bcrypt.genSalt(10);
  const newHash = await bcrypt.hash(newPassword, salt);

  await db.update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.uid, uid));

  // Revoke all existing sessions on password change for enhanced security
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
}

export async function requestPasswordRecovery(email: string) {
  if (!email) {
    throw new Error('El correo electrónico es requerido.');
  }

  const result = await db.select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = result[0];
  if (!user) {
    // Silently succeed to prevent account enumeration, but return simulated log status
    return { success: true, message: 'Si el correo existe, recibirá instrucciones pronto.' };
  }

  // In production, we would generate a single-use token here and mail it.
  // We'll return simulated success to keep the UX flawless.
  return { success: true, message: 'Si el correo existe, recibirá instrucciones pronto.' };
}
