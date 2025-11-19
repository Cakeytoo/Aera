import sqlite3 from "sqlite3";
import { open } from "sqlite";

const db = await open({
  filename: "./users.db",
  driver: sqlite3.Database,
});

// Create table if not exists
await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  )
`);
await db.exec(`
  CREATE TABLE IF NOT EXISTS pending_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    otp TEXT
  )
`);


export default db;
