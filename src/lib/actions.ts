'use server';

/**
 * JurnalStar Server Actions — Bookmark System
 *
 * DESIGN RULES:
 * - Session-based: userId = session cookie (no login required)
 * - Anti-crash: every Prisma query in try/catch
 * - Anti-duplicate: @@unique([userId, journalId]) enforced at DB level
 * - Journal upserted before bookmark created (FK integrity)
 * - Never crashes the library page — returns [] on any error
 */

import prisma from './prisma';
import { Journal as JournalType } from '@/types/journal';
import { revalidatePath } from 'next/cache';

// ─────────────────────────────────────────────────────────────
// SESSION
// ─────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'jurnalstar_super_secret_key_123'
);

async function getSessionUserId(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    const { jwtVerify } = await import('jose');
    const cookieStore = await cookies();
    
    // 1. Try to get authenticated user ID first
    const authToken = cookieStore.get('jurnalstar_auth_token')?.value;
    if (authToken) {
      try {
        const { payload } = await jwtVerify(authToken, JWT_SECRET);
        if (payload.userId) {
          console.log(`[SESSION] Authenticated user session: ${payload.userId}`);
          return payload.userId as string;
        }
      } catch (jwtErr) {
        console.warn('[SESSION] Auth token invalid, falling back to guest session');
      }
    }

    // 2. Fallback to guest session ID
    const existing = cookieStore.get('jurnalstar_session_id')?.value;
    if (existing && existing.length > 5) {
      console.log(`[SESSION] Existing guest session: ${existing.slice(0, 12)}...`);
      return existing;
    }
    
    // Generate new persistent guest session ID
    const newId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    console.log(`[SESSION] New guest session created: ${newId.slice(0, 16)}...`);
    return newId;
  } catch (e) {
    console.warn('[SESSION] Session identification failed — using default guest ID');
    return 'guest_default_session';
  }
}

async function setSessionCookie(sessionId: string): Promise<void> {
  if (!sessionId.startsWith('guest_')) return;
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    if (!cookieStore.has('jurnalstar_session_id')) {
      cookieStore.set('jurnalstar_session_id', sessionId, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
      console.log(`[SESSION] Cookie set: ${sessionId.slice(0, 16)}...`);
    }
  } catch {
    // Non-critical — cookie set failures are expected in some contexts
  }
}

// ─────────────────────────────────────────────────────────────
// JOURNAL UPSERT — Ensures paper exists in DB before bookmarking
// ─────────────────────────────────────────────────────────────

async function ensureJournalExists(journalData: JournalType): Promise<boolean> {
  const journalId = journalData.paperId || journalData.id;
  if (!journalId) {
    console.error('[BOOKMARK] Cannot upsert journal: missing paperId');
    return false;
  }

  try {
    // Serialize authors as JSON string for storage
    const authorsJson = JSON.stringify(
      journalData.authors?.map(a => ({ name: a.name || 'Unknown' })) || []
    );

    // Plain text author string for backward compatibility
    const authorText = journalData.authors?.map(a => a.name).filter(Boolean).join(', ') || 'Unknown';

    await prisma.journal.upsert({
      where: { id: journalId },
      update: {
        title: journalData.title || 'Untitled',
        abstract: journalData.abstract || null,
        authorsJson,
        author: authorText,
        year: journalData.year || null,
        source: journalData.source || null,
        venue: journalData.venue || null,
        pdfUrl: journalData.openAccessPdf?.url || (journalData as any).pdfUrl || null,
        externalUrl: journalData.url || null,
        doi: journalData.doi || null,
        citations: journalData.citationCount || 0,
        isOpenAccess: journalData.isOpenAccess || false,
      },
      create: {
        id: journalId,
        title: journalData.title || 'Untitled',
        abstract: journalData.abstract || null,
        authorsJson,
        author: authorText,
        year: journalData.year || null,
        source: journalData.source || null,
        sourceId: journalId,
        venue: journalData.venue || null,
        pdfUrl: journalData.openAccessPdf?.url || (journalData as any).pdfUrl || null,
        externalUrl: journalData.url || null,
        doi: journalData.doi || null,
        citations: journalData.citationCount || 0,
        isOpenAccess: journalData.isOpenAccess || false,
      },
    });

    console.log(`[DATABASE] Journal upserted: ${journalId}`);
    return true;
  } catch (error: any) {
    console.error(`[DATABASE] Journal upsert failed for ${journalId}:`, error.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// TOGGLE BOOKMARK
// ─────────────────────────────────────────────────────────────

export async function toggleBookmark(journalData: JournalType): Promise<{ bookmarked: boolean; error?: string }> {
  const sessionId = await getSessionUserId();
  await setSessionCookie(sessionId);

  const journalId = journalData.paperId || journalData.id;
  if (!journalId) {
    console.error('[BOOKMARK] Missing journalId — cannot bookmark');
    return { bookmarked: false, error: 'ID jurnal tidak valid' };
  }

  console.log(`[BOOKMARK] Toggle: sessionId=${sessionId.slice(0, 12)}, journalId=${journalId}`);

  // 1. Ensure journal exists (FK integrity)
  const journalOk = await ensureJournalExists(journalData);
  if (!journalOk) {
    return { bookmarked: false, error: 'Gagal menyimpan metadata jurnal' };
  }

  // 2. Check existing bookmark
  try {
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_journalId: { userId: sessionId, journalId },
      },
    });

    if (existing) {
      // Remove bookmark
      await prisma.bookmark.delete({ where: { id: existing.id } });
      console.log(`[BOOKMARK] Removed: ${journalId}`);
      revalidatePath('/library');
      return { bookmarked: false };
    } else {
      // Add bookmark
      await prisma.bookmark.create({
        data: { userId: sessionId, journalId },
      });
      console.log(`[BOOKMARK] Added: ${journalId}`);
      revalidatePath('/library');
      return { bookmarked: true };
    }
  } catch (error: any) {
    console.error('[BOOKMARK] Toggle failed:', error.message);
    // Handle unique constraint race condition gracefully
    if (error.code === 'P2002') {
      return { bookmarked: true }; // Already bookmarked (concurrent request)
    }
    return { bookmarked: false, error: 'Gagal memperbarui bookmark' };
  }
}

// ─────────────────────────────────────────────────────────────
// GET BOOKMARKS — For library page
// ─────────────────────────────────────────────────────────────

export async function getBookmarks(): Promise<JournalType[]> {
  const sessionId = await getSessionUserId();

  if (!sessionId || sessionId.length < 5) {
    console.warn('[BOOKMARK] No valid session — returning empty bookmarks');
    return [];
  }

  console.log(`[BOOKMARK] Fetching bookmarks for session: ${sessionId.slice(0, 12)}...`);

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: sessionId },
      include: { journal: true },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`[BOOKMARK] Found ${bookmarks.length} bookmarks`);

    return bookmarks
      .filter((b: any) => b.journal) // Safety: skip orphaned bookmarks
      .map((b: any) => {
        const j = b.journal;

        // Parse authorsJson or fall back to author string
        let authors: { authorId: string; name: string }[] = [];
        try {
          if (j.authorsJson) {
            const parsed = JSON.parse(j.authorsJson);
            if (Array.isArray(parsed)) {
              authors = parsed.map((a: any) => ({ authorId: '', name: a.name || 'Unknown' }));
            }
          }
        } catch {}

        if (authors.length === 0 && j.author) {
          authors = j.author.split(',').map((name: string) => ({ authorId: '', name: name.trim() }));
        }

        return {
          paperId: j.id,
          id: j.id,
          title: j.title || 'Untitled',
          authors,
          year: j.year || undefined,
          abstract: j.abstract || undefined,
          venue: j.venue || undefined,
          source: j.source || 'unknown',
          citationCount: j.citations || 0,
          isOpenAccess: j.isOpenAccess || false,
          url: j.externalUrl || undefined,
          pdfUrl: j.pdfUrl || undefined,
          openAccessPdf: j.pdfUrl ? { url: j.pdfUrl, status: 'OPEN' } : undefined,
          doi: j.doi || undefined,
        } as JournalType;
      });
  } catch (error: any) {
    console.error('[BOOKMARK] getBookmarks failed:', error.message, '| Code:', error.code);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// CHECK IS BOOKMARKED — For bookmark button state
// ─────────────────────────────────────────────────────────────

export async function checkIsBookmarked(paperId: string): Promise<boolean> {
  if (!paperId) return false;

  const sessionId = await getSessionUserId();
  if (!sessionId || sessionId.length < 5) return false;

  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_journalId: { userId: sessionId, journalId: paperId },
      },
    });
    return !!bookmark;
  } catch (error: any) {
    console.error('[BOOKMARK] checkIsBookmarked failed:', error.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// GET BOOKMARK COUNT — For Navbar badge
// ─────────────────────────────────────────────────────────────

export async function getBookmarkCount(): Promise<number> {
  const sessionId = await getSessionUserId();
  if (!sessionId || sessionId.length < 5) return 0;

  try {
    return await prisma.bookmark.count({ where: { userId: sessionId } });
  } catch {
    return 0;
  }
}
// ─────────────────────────────────────────────────────────────
// ADD TO WORKSPACE COLLECTION
// ─────────────────────────────────────────────────────────────

export async function addToWorkspaceCollection(journalIds: string[], collectionName: string = "Koleksi Impor"): Promise<{ success: boolean; error?: string }> {
  const sessionId = await getSessionUserId();
  
  try {
    // 1. Find or create collection
    const collection = await prisma.researchCollection.upsert({
      where: { 
        id: `col_${sessionId}_${collectionName.toLowerCase().replace(/\s+/g, '_')}` // deterministic for this example
      },
      update: { name: collectionName },
      create: {
        id: `col_${sessionId}_${collectionName.toLowerCase().replace(/\s+/g, '_')}`,
        userId: sessionId,
        name: collectionName,
      }
    });

    // 2. Process each journal
    const journals = await prisma.journal.findMany({
      where: { id: { in: journalIds } }
    });

    console.log(`[WORKSPACE] Found ${journals.length} out of ${journalIds.length} journals in DB`);
    console.log(`[WORKSPACE] Targeting Collection ID: ${collection.id} for User: ${sessionId}`);

    for (const journal of journals) {
      // Check if already in workspace
      const existingDoc = await prisma.workspaceDocument.findFirst({
        where: { userId: sessionId, title: journal.title }
      });

      if (!existingDoc) {
        console.log(`[WORKSPACE] Creating new document for journal: ${journal.title}`);
        // Create as workspace document
        await prisma.workspaceDocument.create({
          data: {
            userId: sessionId,
            title: journal.title,
            fileName: journal.id,
            type: "online",
            metadata: {
              authors: journal.author,
              year: journal.year,
              doi: journal.doi,
              abstract: journal.abstract
            },
            // Link to collection
            collections: {
              connect: { id: collection.id }
            }
          }
        });
      } else {
        console.log(`[WORKSPACE] Document already exists, linking to collection: ${journal.title}`);
        // Just ensure it's linked to this collection
        await prisma.researchCollection.update({
          where: { id: collection.id },
          data: {
            documents: {
              connect: { id: existingDoc.id }
            }
          }
        });
      }
    }

    console.log(`[WORKSPACE] Completed processing for collection "${collectionName}"`);
    return { success: true };
  } catch (error: any) {
    console.error('[WORKSPACE] Error adding to collection:', error);
    return { success: false, error: error.message || 'Gagal menambahkan ke Workspace' };
  }
}
