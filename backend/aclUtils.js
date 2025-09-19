const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(path.join(__dirname, "acl.db"));

function parseACLFromFile(switchName, fileName) {
  const filePath = path.join(__dirname, "../downloads", switchName, fileName);
  if (!fs.existsSync(filePath)) return [];

  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  const aclLines = lines.filter(line => line.trim().startsWith("access-list")); // Cisco style
  return aclLines.map(line => ({
    switch_name: switchName,
    file_name: fileName,
    raw_line: line.trim()
  }));
}

// Save parsed ACLs to DB
function saveACLsToDB(acls) {
  const stmt = db.prepare(
    "INSERT INTO acl_rules (switch_name, file_name, raw_line) VALUES (?, ?, ?)"
  );
  acls.forEach(acl => stmt.run(acl.switch_name, acl.file_name, acl.raw_line));
  stmt.finalize();
}

// Get ACLs from DB
function getACLsFromDB(switchName, fileName, callback) {
  db.all(
    "SELECT * FROM acl_rules WHERE switch_name = ? AND file_name = ? ORDER BY id ASC",
    [switchName, fileName],
    (err, rows) => callback(err, rows)
  );
}

module.exports = { parseACLFromFile, saveACLsToDB, getACLsFromDB };
