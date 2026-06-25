import { db } from '../index.ts';
import { activityLogs } from '../schema.ts';
import { desc } from 'drizzle-orm';

export async function getActivityLogsList() {
  try {
    return await db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp));
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw new Error('Database query failed: activity logs lookup.', { cause: error });
  }
}

export async function createLogRecord(user: string, action: string, details: string) {
  try {
    const result = await db.insert(activityLogs)
      .values({
        user,
        action,
        details,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error creating activity log:', error);
    throw new Error('Database insert failed: activity log entry.', { cause: error });
  }
}
