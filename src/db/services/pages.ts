import { db } from '../index.ts';
import { pages, pageVersions, formSubmissions } from '../schema.ts';
import { eq, desc } from 'drizzle-orm';

// --- Page Helpers ---
export async function getPagesList() {
  try {
    return await db.select().from(pages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    throw new Error('Database query failed: pages lookup.', { cause: error });
  }
}

export async function createPageRecord(id: string, title: string, slug: string, description: string, blocks: any) {
  try {
    const result = await db.insert(pages)
      .values({
        id,
        title,
        slug,
        description,
        blocks,
        isPublished: false,
        version: 1,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error creating page:', error);
    throw new Error('Database insert failed: page creation.', { cause: error });
  }
}

export async function updatePageRecord(id: string, updates: { title?: string; slug?: string; description?: string; blocks?: any; isPublished?: boolean; version?: number }) {
  try {
    const result = await db.update(pages)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error(`Error updating page ${id}:`, error);
    throw new Error(`Database update failed: page ${id} modification.`, { cause: error });
  }
}

export async function deletePageRecord(id: string) {
  try {
    const result = await db.delete(pages)
      .where(eq(pages.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error(`Error deleting page ${id}:`, error);
    throw new Error(`Database delete failed: page ${id} removal.`, { cause: error });
  }
}

// --- Version Helpers ---
export async function getAllVersionsList() {
  try {
    return await db.select()
      .from(pageVersions)
      .orderBy(desc(pageVersions.createdAt));
  } catch (error) {
    console.error('Error fetching all versions:', error);
    throw new Error('Database query failed: all page versions lookup.', { cause: error });
  }
}

export async function getPageVersionsList(pageId: string) {
  try {
    return await db.select()
      .from(pageVersions)
      .where(eq(pageVersions.pageId, pageId))
      .orderBy(desc(pageVersions.version));
  } catch (error) {
    console.error(`Error fetching versions for page ${pageId}:`, error);
    throw new Error(`Database query failed: page versions lookup for page ${pageId}.`, { cause: error });
  }
}

export async function createVersionRecord(id: string, pageId: string, version: number, title: string, slug: string, description: string, blocks: any, createdBy: string, changeSummary: string) {
  try {
    const result = await db.insert(pageVersions)
      .values({
        id,
        pageId,
        version,
        title,
        slug,
        description,
        blocks,
        createdBy,
        changeSummary,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error creating page version:', error);
    throw new Error('Database insert failed: page version snapshot creation.', { cause: error });
  }
}

// --- Submission Helpers ---
export async function getFormSubmissionsList() {
  try {
    return await db.select().from(formSubmissions).orderBy(desc(formSubmissions.submittedAt));
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw new Error('Database query failed: form submissions lookup.', { cause: error });
  }
}

export async function createFormSubmissionRecord(id: string, formBlockId: string, formTitle: string, pageTitle: string, data: any) {
  try {
    const result = await db.insert(formSubmissions)
      .values({
        id,
        formBlockId,
        formTitle,
        pageTitle,
        data,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error creating submission:', error);
    throw new Error('Database insert failed: form submission entry.', { cause: error });
  }
}

export async function deleteFormSubmissionRecord(id: string) {
  try {
    const result = await db.delete(formSubmissions)
      .where(eq(formSubmissions.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error deleting submission:', error);
    throw new Error('Database delete failed: form submission removal.', { cause: error });
  }
}
