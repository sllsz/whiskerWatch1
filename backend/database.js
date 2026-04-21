import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'whiskerwatch.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS cats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    breed TEXT DEFAULT '',
    birth_date TEXT DEFAULT '',
    weight REAL DEFAULT 0,
    avatar_color TEXT DEFAULT '',
    avatar_ear TEXT DEFAULT '',
    avatar_eye TEXT DEFAULT '',
    avatar_pattern TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cat_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT DEFAULT '',
    appetite INTEGER NOT NULL CHECK(appetite BETWEEN 1 AND 5),
    activity INTEGER NOT NULL CHECK(activity BETWEEN 1 AND 5),
    litter_box INTEGER NOT NULL CHECK(litter_box BETWEEN 1 AND 5),
    mood INTEGER NOT NULL CHECK(mood BETWEEN 1 AND 5),
    water_intake INTEGER DEFAULT 3 CHECK(water_intake BETWEEN 1 AND 5),
    vomiting INTEGER DEFAULT 0,
    sneezing INTEGER DEFAULT 0,
    lethargy INTEGER DEFAULT 0,
    diarrhea INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (cat_id) REFERENCES cats(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_logs_cat_date ON daily_logs(cat_id, date);

  CREATE TABLE IF NOT EXISTS custom_symptoms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS log_custom_symptoms (
    log_id INTEGER NOT NULL,
    symptom_id INTEGER NOT NULL,
    FOREIGN KEY (log_id) REFERENCES daily_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (symptom_id) REFERENCES custom_symptoms(id) ON DELETE CASCADE,
    PRIMARY KEY (log_id, symptom_id)
  );
`);

export default db;
