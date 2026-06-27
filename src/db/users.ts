import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const fallbackUsername = displayName || email.split('@')[0];
    const defaultRole = email === 'angelleiva3hola@gmail.com' ? 'owner' : 'viewer';

    const result = await db.insert(users)
      .values({
        uid,
        email,
        username: fallbackUsername,
        roleId: defaultRole,
        status: 'active',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          username: fallbackUsername,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('Database user sync failed.', { cause: error });
  }
}

export async function getUserWithPermissions(uid: string) {
  try {
    const result = await db.query.users.findFirst({
      where: eq(users.uid, uid),
      with: {
        role: {
          with: {
            permissions: {
              with: {
                permission: true,
              },
            },
          },
        },
      },
    });
    return result;
  } catch (error) {
    console.error('Error fetching user with permissions:', error);
    throw new Error('Database user fetch failed.', { cause: error });
  }
}
