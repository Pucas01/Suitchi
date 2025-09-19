const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const tftp = require("tftp");

const app = express();
app.use(cors());
app.use(express.json());

const LOCAL_DIR = path.join(__dirname, "downloads");
const SWITCHES_FILE = path.join(__dirname, "switches.json");
const CONFIG_FILE = path.join(__dirname, "config.json");

const sqlite3 = require("sqlite3").verbose();
const DB_FILE = path.join(__dirname, "acl.db");
const db = new sqlite3.Database(DB_FILE);

// ---------------- Database ----------------
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

// ---------------- Helpers ----------------
const getSwitches = () => (fs.existsSync(SWITCHES_FILE) ? JSON.parse(fs.readFileSync(SWITCHES_FILE, "utf-8")) : []);
const saveSwitches = (switches) => fs.writeFileSync(SWITCHES_FILE, JSON.stringify(switches, null, 2));
const getConfig = () => (fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")) : { tftpServer: "" });
const saveConfig = (config) => fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

const normalizeFiles = (files, fallbackName) => {
  if (Array.isArray(files)) return files.filter(Boolean);
  if (typeof files === "string") return files.split(",").map(f => f.trim()).filter(Boolean);
  return ["startup-config", "running-config"];
};

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

// ---------------- ACL Parser ----------------

/**
 * Parse ACLs from a switch config file into structured objects
 */
function parseACLFromFile(switchName, fileName) {
  const filePath = path.join(LOCAL_DIR, switchName, fileName);
  if (!fs.existsSync(filePath)) return [];

  const lines = fs.readFileSync(filePath, "utf-8").split(/\r?\n/);
  const aclBlocks = [];
  let currentAcl = null;
  let lineNumber = 1;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Start of a named ACL
    const aclMatch = line.match(/^ip access-list extended (.+)/);
    if (aclMatch) {
      currentAcl = { name: aclMatch[1], lines: [] };
      aclBlocks.push(currentAcl);
      lineNumber = 1;
      continue;
    }

    if (currentAcl) {
      const match = line.match(/^(permit|deny)\s+(\S+)\s+(.+)$/);
      if (match) {
        const [_, action, protocol, rest] = match;

        // Split rest into source, destination, and extras
        let src_host = "-", src_wildcard = "-", src_port = "-";
        let dst_host = "-", dst_wildcard = "-", dst_port = "-";
        let established = false;

        // Simple regex for typical ACL lines
        const parts = rest.split(/\s+/);
        // Source parsing
        if (parts[0] === "any") {
          src_host = "any";
          parts.shift();
        } else if (parts[0] === "host") {
          src_host = parts[1];
          parts.splice(0, 2);
        } else {
          src_host = parts[0];
          src_wildcard = parts[1] || "-";
          parts.splice(0, 2);
        }

        // Source port
        if (parts[0] && /^(eq|gt|lt|neq|range)$/.test(parts[0])) {
          src_port = parts[0] + " " + parts[1];
          parts.splice(0, 2);
        }

        // Destination parsing
        if (parts[0] === "any") {
          dst_host = "any";
          parts.shift();
        } else if (parts[0] === "host") {
          dst_host = parts[1];
          parts.splice(0, 2);
        } else {
          dst_host = parts[0];
          dst_wildcard = parts[1] || "-";
          parts.splice(0, 2);
        }

        // Destination port
        if (parts[0] && /^(eq|gt|lt|neq|range)$/.test(parts[0])) {
          dst_port = parts[0] + " " + parts[1];
          parts.splice(0, 2);
        }

        // Check for 'established' keyword
        if (parts.includes("established")) established = true;

        currentAcl.lines.push({
          line_number: lineNumber++,
          acl_name: currentAcl.name,
          action,
          protocol,
          src_host,
          src_wildcard,
          src_port,
          dst_host,
          dst_wildcard,
          dst_port,
          established
        });
      }
    }
  }

  // Flatten ACL blocks for DB storage
  return aclBlocks.flatMap(block =>
    block.lines.map(line => ({
      switch_name: switchName,
      file_name: fileName,
      ...line,
      raw_line: `${line.action} ${line.protocol} ${line.src_host} ${line.src_wildcard} ${line.src_port} ${line.dst_host} ${line.dst_wildcard} ${line.dst_port}${line.established ? " established" : ""}`
    }))
  );
}



// ---------------- API ----------------

// Switches
app.get("/api/switches", (req, res) => res.json(getSwitches()));

app.post("/api/switches", (req, res) => {
  const { name, ip, image, files } = req.body;
  if (!name || !ip) return res.status(400).json({ error: "Name and IP required" });

  let switches = getSwitches();
  if (switches.find(sw => sw.name === name)) return res.status(400).json({ error: "Switch already exists" });

  const newSwitch = { name, ip, image: image || "/images/cisco_switch.jpg", files: normalizeFiles(files, name) };
  switches.push(newSwitch);
  saveSwitches(switches);

  fs.mkdirSync(path.join(LOCAL_DIR, name), { recursive: true });

  res.json({ success: true, switch: newSwitch });
});

app.delete("/api/switches/:name", (req, res) => {
  let switches = getSwitches();
  const { name } = req.params;
  if (!switches.find(sw => sw.name === name)) return res.status(404).json({ error: "Switch not found" });

  switches = switches.filter(sw => sw.name !== name);
  saveSwitches(switches);

  const dir = path.join(LOCAL_DIR, name);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });

  res.json({ success: true });
});

app.put("/api/switches/:name", (req, res) => {
  const { name } = req.params;
  const { name: newName, ip, image, files } = req.body;

  let switches = getSwitches();
  const index = switches.findIndex(sw => sw.name === name);
  if (index === -1) return res.status(404).json({ error: "Switch not found" });

  const oldName = switches[index].name;
  switches[index] = { name: newName, ip, image, files: normalizeFiles(files, newName) };
  saveSwitches(switches);

  const oldDir = path.join(LOCAL_DIR, oldName);
  const newDir = path.join(LOCAL_DIR, newName);
  if (oldName !== newName && fs.existsSync(oldDir)) fs.renameSync(oldDir, newDir);

  res.json({ success: true, switch: switches[index] });
});

// Backups
app.use("/downloads", express.static(LOCAL_DIR));

app.get("/api/backups", (req, res) => {
  const switches = getSwitches();
  const result = {};

  switches.forEach(sw => {
    const dir = path.join(LOCAL_DIR, sw.name);
    const backups = fs.existsSync(dir) ? fs.readdirSync(dir) : [];

    // Map each file to include last configuration change
    const backupsWithMeta = backups.map(file => {
      const filePath = path.join(dir, file);
      let lastChange = "-";
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        // Look for a line like "Last configuration change at 08:35:39 UTC Wed Sep 17 2025 by Lucas"
        const match = content.match(/Last configuration change at (.+)/);
        if (match) lastChange = match[1];
      }
      return { name: file, lastChange };
    });

    result[sw.name] = backupsWithMeta;
  });

  res.json(result);
});

app.delete("/api/backups/:switchName/:fileName", (req, res) => {
  const { switchName, fileName } = req.params;
  const filePath = path.join(LOCAL_DIR, switchName, fileName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });

  fs.unlinkSync(filePath);
  res.json({ success: true });
});

// TFTP
app.get("/api/config/tftp", (req, res) => res.json({ config: getConfig() }));
app.put("/api/config/tftp", (req, res) => {
  const { tftpServer } = req.body;
  if (!tftpServer) return res.status(400).json({ error: "TFTP server IP required" });
  const config = getConfig();
  config.tftpServer = tftpServer;
  saveConfig(config);
  res.json({ success: true, config });
});

app.get("/api/fetch-missing/:switchName", async (req, res) => {
  const { switchName } = req.params;
  const switches = getSwitches();
  const config = getConfig();
  const sw = switches.find(s => s.name === switchName);
  if (!sw) return res.status(404).json({ error: "Switch not found" });
  if (!config.tftpServer) return res.status(400).json({ error: "TFTP server not configured" });

  const fetched = [];
  try {
    const switchDir = path.join(LOCAL_DIR, sw.name);
    fs.mkdirSync(switchDir, { recursive: true });
    const client = tftp.createClient({ host: config.tftpServer, port: 69, timeout: 5000 });

    for (const filename of normalizeFiles(sw.files, sw.name)) {
      if (!filename) continue;

      const tmpFile = path.join(__dirname, path.basename(filename));
      const destFile = path.join(switchDir, path.basename(filename));

      await new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(tmpFile);
        client.get(filename, ws, (err) => {
          if (err) return reject(err);
          fs.copyFileSync(tmpFile, destFile);
          fs.unlinkSync(tmpFile);
          fetched.push({ switch: sw.name, file: filename });
          resolve();
        });
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message, fetched });
  }

  res.json({ fetched });
});

// Fetch ACL rules for a specific switch and file
app.get("/api/acl/:switchName/:fileName", (req, res) => {
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
app.delete("/api/acl", (req, res) => {
  db.run("DELETE FROM acl_rules", (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ---------------- Start server ----------------
const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
