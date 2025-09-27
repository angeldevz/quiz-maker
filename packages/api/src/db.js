const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'data.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function runSQLFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  db.exec(sql);
}

function migrate() {
  const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  runSQLFile(schemaPath);
}

module.exports = { db, migrate };
