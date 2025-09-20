const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_FILE = path.join(__dirname, "acl.db");
const db = new sqlite3.Database(DB_FILE);

const DEFAULT_ADMIN = { username: "admin", password: "admin123" };
const SALT_ROUNDS = 10;

// Create ACL table
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
`, (err) => {
  if (err) console.error("Error creating acl_rules table:", err);
});

// Create users table and ensure default admin
db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user'
)
`, async (err) => {
  if (err) return console.error("Error creating users table:", err);

  // ✅ Table exists, now safe to check/create admin
  db.get(`SELECT * FROM users WHERE username = ?`, [DEFAULT_ADMIN.username], async (err, row) => {
    if (err) return console.error("Error checking admin user:", err);
    if (!row) {
      const hashed = await bcrypt.hash(DEFAULT_ADMIN.password, SALT_ROUNDS);
      db.run(
        `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
        [DEFAULT_ADMIN.username, hashed, "admin"],
        (err) => {
          if (err) console.error("Error creating default admin:", err);
          else console.log(`✅ Default admin created: ${DEFAULT_ADMIN.username}/${DEFAULT_ADMIN.password}`);
        }
      );
    } else {
      console.log("✅ Default admin already exists");
    }
  });
});

// ---------------- ACL helpers ----------------
function getACLsFromDB(switchName, fileName, callback) {
  db.all(`SELECT id, switch_name, file_name, raw_line FROM acl_rules WHERE switch_name = ? AND file_name = ?`, [switchName, fileName], callback);
}

function saveACLsToDB(aclArray) {
  if (!aclArray.length) return;
  const stmt = db.prepare(`INSERT INTO acl_rules (switch_name, file_name, raw_line) VALUES (?, ?, ?)`);
  aclArray.forEach(({ switch_name, file_name, raw_line }) => stmt.run(switch_name, file_name, raw_line));
  stmt.finalize();
}

module.exports = db;
