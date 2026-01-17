import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function initDB() {
  db = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      edge_id TEXT,
      title TEXT,
      snippet TEXT,
      source TEXT,
      date TEXT
    );
    CREATE TABLE IF NOT EXISTS entity_map (
      id INTEGER PRIMARY KEY,
      label TEXT,
      node_id TEXT
    );
  `);
  
  // Seed Evidence if empty
  const count = await db.get('SELECT count(*) as c FROM evidence');
  if (count.c === 0) {
      await db.run(`INSERT INTO evidence (edge_id, title, snippet, source, date) VALUES 
      ('MSFT-OPENAI', 'Microsoft invests $10B', 'Confirmed massive investment for 49% stake.', 'TechCrunch', '2023-01-23'),
      ('AAPL-GOOGL', 'Google pays Apple $20B', 'Antitrust trial reveals scale of search payments.', 'Bloomberg', '2023-10-10')
      `);
  }
}

export function getDB() {
  if (!db) throw new Error("DB not initialized");
  return db;
}
