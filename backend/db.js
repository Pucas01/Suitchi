const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_FILE = path.join(__dirname, "acl.db");
const db = new sqlite3.Database(DB_FILE);

db.run(`
CREATE TABLE IF NOT EXISTS acl_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  switch_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  line_number INTEGER,
  acl_name TEXT,
  action TEXT,
  protocol TEXT,
  src_host TEXT,
  src_wildcard TEXT,
  src_port TEXT,
  dst_host TEXT,
  dst_wildcard TEXT,
  dst_port TEXT,
  established BOOLEAN,
  raw_line TEXT
)
`);

// Get ACLs from DB
function getACLsFromDB(switchName, fileName, callback) {
  db.all(`SELECT id, switch_name, file_name, raw_line FROM acl_rules WHERE switch_name = ? AND file_name = ?`, [switchName, fileName], callback);
}

// Save ACLs to DB
function saveACLsToDB(aclArray) {
  if (!aclArray.length) return;
  const stmt = db.prepare(`INSERT INTO acl_rules (switch_name, file_name, raw_line) VALUES (?, ?, ?)`);
  aclArray.forEach(({ switch_name, file_name, raw_line }) => stmt.run(switch_name, file_name, raw_line));
  stmt.finalize();
}

module.exports = db;
