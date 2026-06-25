import { db } from '../index.ts';
import { users, roles, permissions, rolePermissions } from '../schema.ts';
import { eq, and } from 'drizzle-orm';

export async function getAllRoles() {
  try {
    return await db.query.roles.findMany({
      with: {
        permissions: true,
      },
    });
  } catch (error) {
    console.error('Error in getAllRoles:', error);
    throw new Error('Database query failed: roles lookup.', { cause: error });
  }
}

export async function getAllPermissions() {
  try {
    return await db.select().from(permissions);
  } catch (error) {
    console.error('Error in getAllPermissions:', error);
    throw new Error('Database query failed: permissions lookup.', { cause: error });
  }
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  try {
    // Wrap in a transaction to safely update role permissions
    await db.transaction(async (tx) => {
      // 1. Delete all existing permissions for the role
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      
      // 2. Insert new permission mappings
      if (permissionIds.length > 0) {
        const values = permissionIds.map((pId) => ({
          roleId,
          permissionId: pId,
        }));
        await tx.insert(rolePermissions).values(values);
      }
    });
  } catch (error) {
    console.error(`Error updating permissions for role ${roleId}:`, error);
    throw new Error(`Database transaction failed: updating permissions for role ${roleId}.`, { cause: error });
  }
}

export async function getAllUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw new Error('Database query failed: users lookup.', { cause: error });
  }
}

export async function createStaffUser(username: string, email: string, roleId: string) {
  try {
    // Generate a secure temp UID for staff invitation
    const tempUid = `staff-temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const result = await db.insert(users)
      .values({
        uid: tempUid,
        username,
        email,
        roleId,
        status: 'active',
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error in createStaffUser:', error);
    throw new Error('Database insert failed: staff user creation.', { cause: error });
  }
}

export async function updateStaffUserRole(uid: string, roleId: string) {
  try {
    const result = await db.update(users)
      .set({ roleId })
      .where(eq(users.uid, uid))
      .returning();
    return result[0];
  } catch (error) {
    console.error(`Error updating role for user ${uid}:`, error);
    throw new Error(`Database update failed: user role modification.`, { cause: error });
  }
}

export async function deleteStaffUser(uid: string) {
  try {
    const result = await db.delete(users)
      .where(eq(users.uid, uid))
      .returning();
    return result[0];
  } catch (error) {
    console.error(`Error deleting user ${uid}:`, error);
    throw new Error(`Database delete failed: staff user removal.`, { cause: error });
  }
}
