import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'gestcopta.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent reads
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nom         TEXT NOT NULL UNIQUE,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS permissions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    module      TEXT NOT NULL,
    action      TEXT NOT NULL,
    description TEXT,
    UNIQUE(module, action)
  );

  CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    nom                 TEXT NOT NULL,
    email               TEXT NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    role_id             INTEGER REFERENCES roles(id),
    statut              TEXT NOT NULL DEFAULT 'actif' CHECK(statut IN ('actif','inactif')),
    must_change_password INTEGER NOT NULL DEFAULT 1,
    derniere_connexion  TEXT,
    session_timeout     INTEGER NOT NULL DEFAULT 30,
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_permissions (
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted       INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, permission_id)
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER REFERENCES users(id),
    user_nom        TEXT,
    user_email      TEXT,
    action          TEXT NOT NULL,
    module          TEXT NOT NULL,
    ancienne_valeur TEXT,
    nouvelle_valeur TEXT,
    resultat        TEXT NOT NULL DEFAULT 'succes' CHECK(resultat IN ('succes','echec')),
    raison_echec    TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
`);

export default db;
