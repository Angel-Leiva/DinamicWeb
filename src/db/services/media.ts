import { db } from '../index.ts';
import { mediaFiles } from '../schema.ts';
import { desc, eq } from 'drizzle-orm';

export async function getMediaFilesList() {
  try {
    return await db.select().from(mediaFiles).orderBy(desc(mediaFiles.createdAt));
  } catch (error) {
    console.error('Error fetching media files:', error);
    throw new Error('Database query failed: media metadata lookup.', { cause: error });
  }
}

export async function createMediaFileRecord(id: string, name: string, url: string, size: string, type: string) {
  try {
    const result = await db.insert(mediaFiles)
      .values({
        id,
        name,
        url,
        size,
        type,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error registering media file:', error);
    throw new Error('Database insert failed: media metadata registration.', { cause: error });
  }
}

export async function deleteMediaFileRecord(id: string) {
  try {
    const result = await db.delete(mediaFiles)
      .where(eq(mediaFiles.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error(`Error deleting media file ${id}:`, error);
    throw new Error(`Database delete failed: media metadata removal.`, { cause: error });
  }
}
