const express = require("express");
const router = express.Router();
const db = require("../db");
const { parseACLFromFile } = require("../aclParser");

// Fetch ACL rules for a specific switch and file
router.get("/:switchName/:fileName", (req, res) => {
  const { switchName, fileName } = req.params;

  // Step 1: Check DB first
  const sql = `SELECT * FROM acl_rules WHERE switch_name = ? AND file_name = ? ORDER BY line_number ASC`;
  db.all(sql, [switchName, fileName], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    if (rows.length > 0) {
      // Convert 'established' from 0/1 to boolean
      const normalized = rows.map(r => ({
        ...r,
        established: !!r.established
      }));
      return res.json(normalized);
    }

    // Step 2: DB empty — parse from file
    const parsed = parseACLFromFile(switchName, fileName);

    if (parsed.length === 0) {
      return res.json([]); // no ACLs found
    }

    // Step 3: Insert parsed ACLs into DB
    const stmt = db.prepare(
      `INSERT INTO acl_rules 
        (switch_name, file_name, line_number, acl_name, action, protocol, src_host, src_wildcard, src_port, dst_host, dst_wildcard, dst_port, established, raw_line) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const r of parsed) {
      stmt.run(
        r.switch_name,
        r.file_name,
        r.line_number,
        r.acl_name,
        r.action,
        r.protocol,
        r.src_host,
        r.src_wildcard,
        r.src_port,
        r.dst_host,
        r.dst_wildcard,
        r.dst_port,
        r.established ? 1 : 0,
        r.raw_line || ""
      );
    }

    stmt.finalize(err => {
      if (err) console.error("DB Insert Error:", err);
      // Step 4: Return parsed data
      res.json(parsed);
    });
  });
});



// Clear all ACL entries
router.delete("/", (req, res) => {
  db.run("DELETE FROM acl_rules", (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

module.exports = router;