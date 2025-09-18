const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const tftp = require("tftp"); // npm install tftp

const app = express();
app.use(cors());
app.use(express.json());

const LOCAL_DIR = path.join(__dirname, "downloads");
const SWITCHES_FILE = path.join(__dirname, "switches.json");
const CONFIG_FILE = path.join(__dirname, "config.json");

// ---------------- Helpers ----------------
const getSwitches = () => {
  if (!fs.existsSync(SWITCHES_FILE)) return [];
  return JSON.parse(fs.readFileSync(SWITCHES_FILE, "utf-8"));
};

const saveSwitches = (switches) => {
  fs.writeFileSync(SWITCHES_FILE, JSON.stringify(switches, null, 2));
};

const getConfig = () => {
  if (!fs.existsSync(CONFIG_FILE)) return { tftpServer: "" };
  return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
};

const saveConfig = (config) => {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
};

// Normalize "files" so it's always an array
const normalizeFiles = (files, fallbackName) => {
  if (Array.isArray(files)) return files.filter(Boolean);
  if (typeof files === "string") return files.split(",").map((f) => f.trim()).filter(Boolean);
  return ["startup-config", "running-config"]; // default
};

// ---------------- API ----------------

// 1️⃣ Get all switches
app.get("/api/switches", (req, res) => {
  const switches = getSwitches();
  res.json(switches);
});

// 2️⃣ Add a new switch
app.post("/api/switches", (req, res) => {
  const { name, ip, image, files } = req.body;
  if (!name || !ip) return res.status(400).json({ error: "Name and IP required" });

  let switches = getSwitches();
  if (switches.find((sw) => sw.name === name))
    return res.status(400).json({ error: "Switch already exists" });

  const newSwitch = {
    name,
    ip,
    image: image || "/images/cisco_switch.jpg",
    files: normalizeFiles(files, name),
  };

  switches.push(newSwitch);
  saveSwitches(switches);

  // Ensure folder exists for backups
  const switchDir = path.join(LOCAL_DIR, name);
  if (!fs.existsSync(switchDir)) fs.mkdirSync(switchDir, { recursive: true });

  res.json({ success: true, switch: newSwitch });
});

// 3️⃣ Delete a switch
app.delete("/api/switches/:name", (req, res) => {
  const { name } = req.params;
  let switches = getSwitches();

  if (!switches.find((sw) => sw.name === name)) {
    return res.status(404).json({ error: "Switch not found" });
  }

  // Remove from list
  switches = switches.filter((sw) => sw.name !== name);
  saveSwitches(switches);

  // Delete backup folder
  const switchDir = path.join(LOCAL_DIR, name);
  if (fs.existsSync(switchDir)) {
    fs.rmSync(switchDir, { recursive: true, force: true });
  }

  res.json({ success: true });
});

// 4️⃣ Serve backups per switch
app.use("/downloads", express.static(LOCAL_DIR));

// 5️⃣ Get backups for all switches
app.get("/api/backups", (req, res) => {
  const switches = getSwitches();
  const result = {};
  switches.forEach((sw) => {
    const switchDir = path.join(LOCAL_DIR, sw.name);
    if (fs.existsSync(switchDir)) {
      result[sw.name] = fs.readdirSync(switchDir);
    } else {
      result[sw.name] = [];
    }
  });
  res.json(result);
});

// 5️⃣a Delete a specific backup/config file
app.delete("/api/backups/:switchName/:fileName", (req, res) => {
  const { switchName, fileName } = req.params;
  const switchDir = path.join(LOCAL_DIR, switchName);
  const filePath = path.join(switchDir, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  try {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting file:", err.message);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// 6️⃣ Fetch missing backups (TFTP logic with error handling)
app.get("/api/fetch-missing", async (req, res) => {
  const switches = getSwitches();
  const config = getConfig();
  const tftpServer = config.tftpServer;

  if (!tftpServer) {
    return res.status(400).json({ error: "TFTP server not configured" });
  }

  const fetched = [];
  let errorResponse = null;

  try {
    for (const sw of switches) {
      const switchDir = path.join(LOCAL_DIR, sw.name);
      if (!fs.existsSync(switchDir)) fs.mkdirSync(switchDir, { recursive: true });

      const client = tftp.createClient({ host: tftpServer, port: 69, timeout: 5000 });
      const filesToFetch = normalizeFiles(sw.files, sw.name);

      for (const filename of filesToFetch) {
        const localFile = path.join(switchDir, filename);

        await new Promise((resolve, reject) => {
          const writeStream = fs.createWriteStream(localFile);
          client.get(filename, writeStream, (err) => {
            if (err) return reject(err);
            fetched.push({ switch: sw.name, file: filename });
            resolve();
          });
        });
      }
    }
  } catch (err) {
    console.error("❌ Fetch stopped due to error:", err.message);
    errorResponse = { error: err.message, fetched };
  }

  if (errorResponse) {
    return res.status(500).json(errorResponse);
  }

  res.json({ fetched });
});

// 7️⃣ Update a switch (with folder rename support)
app.put("/api/switches/:name", (req, res) => {
  const { name } = req.params;
  const { name: newName, ip, image, files } = req.body;

  let switches = getSwitches();
  const index = switches.findIndex((sw) => sw.name === name);
  if (index === -1) return res.status(404).json({ error: "Switch not found" });

  const oldName = switches[index].name;

  switches[index] = {
    name: newName,
    ip,
    image,
    files: normalizeFiles(files, newName),
  };
  saveSwitches(switches);

  // Rename folder if name changed
  const oldDir = path.join(LOCAL_DIR, oldName);
  const newDir = path.join(LOCAL_DIR, newName);

  if (oldName !== newName && fs.existsSync(oldDir)) {
    try {
      fs.renameSync(oldDir, newDir);
    } catch (err) {
      console.error("❌ Error renaming backup folder:", err.message);
    }
  }

  res.json({ success: true, switch: switches[index] });
});

// 8️⃣ Set TFTP server IP
app.put("/api/config/tftp", (req, res) => {
  const { tftpServer } = req.body;
  if (!tftpServer) return res.status(400).json({ error: "TFTP server IP required" });

  const config = getConfig();
  config.tftpServer = tftpServer;
  saveConfig(config);

  res.json({ success: true, config });
});

// 8a️⃣ Get TFTP server IP
app.get("/api/config/tftp", (req, res) => {
  const config = getConfig();
  res.json({ config });
});

// ---------------- Start Server ----------------
const PORT = 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
