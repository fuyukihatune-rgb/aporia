import Dexie, { type Table } from 'dexie';
import type { ExaminationSession } from '../types';

class AporiaDatabase extends Dexie {
  sessions!: Table<ExaminationSession>;

  constructor() {
    super('AporiaDB');
    this.version(1).stores({
      sessions: '++id, createdAt, updatedAt, currentPhase',
    });
  }
}

export const db = new AporiaDatabase();

export async function pruneOldSessions() {
  const count = await db.sessions.count();
  if (count > 100) {
    const oldest = await db.sessions
      .orderBy('updatedAt')
      .limit(count - 100)
      .toArray();
    await db.sessions.bulkDelete(oldest.map((s) => s.id!));
  }
}
