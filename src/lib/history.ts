import { openDB, type DBSchema } from 'idb';
import type { SummaryRecord } from '../types/summary';

interface SummaryDb extends DBSchema {
  summaries: {
    key: string;
    value: SummaryRecord;
    indexes: { createdAt: string };
  };
}

const DB_NAME = 'summaryweb';
const DB_VERSION = 1;

const dbPromise = openDB<SummaryDb>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    const store = db.createObjectStore('summaries', { keyPath: 'id' });
    store.createIndex('createdAt', 'createdAt');
  },
});

export async function saveSummary(record: SummaryRecord): Promise<void> {
  const db = await dbPromise;
  await db.put('summaries', record);
}

export async function listSummaries(): Promise<SummaryRecord[]> {
  const db = await dbPromise;
  const records = await db.getAllFromIndex('summaries', 'createdAt');
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSummary(id: string): Promise<SummaryRecord | undefined> {
  const db = await dbPromise;
  return db.get('summaries', id);
}

export async function deleteSummary(id: string): Promise<void> {
  const db = await dbPromise;
  await db.delete('summaries', id);
}

export async function clearSummaries(): Promise<void> {
  const db = await dbPromise;
  await db.clear('summaries');
}
