import { db } from "../db/db";
import { eq, and, desc } from "drizzle-orm";
import { notes } from "../db/schema/notes";
import { users } from "../db/schema/users";
import { Note, InsertNote } from "../db/schema";

export class NoteService {
  async createNote(data: InsertNote): Promise<Note> {
    const [note] = await db.insert(notes).values(data).returning();
    return note;
  }

  async getCatalogNotes(catalogId: number): Promise<Note[]> {
    const catalogNotes = await db
      .select()
      .from(notes)
      .where(and(eq(notes.catalogId, catalogId), eq(notes.isArchived, false)))
      .orderBy(desc(notes.isPinned), desc(notes.createdAt));

    return catalogNotes;
  }

  async getNoteById(noteId: number): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, noteId));
    return note;
  }

  async deleteNote(noteId: number): Promise<void> {
    await db.delete(notes).where(eq(notes.id, noteId));
  }

  async archiveNote(noteId: number): Promise<void> {
    await db
      .update(notes)
      .set({ isArchived: true })
      .where(eq(notes.id, noteId));
  }
}
