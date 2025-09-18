const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const LOCAL_DIR = path.join(__dirname, "downloads");
const SWITCHES_FILE = path.join(__dirname, "switches.json");

// Helper: read switches
const getSwitches = () => {
  if (!fs.existsSync(SWITCHES_FILE)) return [];
  return JSON.parse(fs.readFileSync(SWITCHES_FILE, "utf-8"));
};

// Helper: save switches
const saveSwitches = (switches) => {
  fs.writeFileSync(SWITCHES_FILE, JSON.stringify(switches, null, 2));
};

// 1️⃣ Get all switches
app.get("/api/switches", (req, res) => {
  const switches = getSwitches();
  res.json(switches);
});

// 2️⃣ Add a new switch
app.post("/api/switches", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });

  const switches = getSwitches();
  if (switches.includes(name))
    return res.status(400).json({ error: "Switch already exists" });

  switches.push(name);
  saveSwitches(switches);

  // Ensure folder exists for backups
  const switchDir = path.join(LOCAL_DIR, name);
  if (!fs.existsSync(switchDir)) fs.mkdirSync(switchDir, { recursive: true });

  res.json({ success: true });
});

// 3️⃣ Delete a switch
app.delete("/api/switches/:name", (req, res) => {
  const { name } = req.params;
  let switches = getSwitches();

  if (!switches.includes(name)) {
    return res.status(404).json({ error: "Switch not found" });
  }

  // Remove from list
  switches = switches.filter((sw) => sw !== name);
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
    const switchDir = path.join(LOCAL_DIR, sw);
    if (fs.existsSync(switchDir)) {
      result[sw] = fs.readdirSync(switchDir);
    } else {
      result[sw] = [];
    }
  });
  res.json(result);
});

// 6️⃣ Fetch missing backups (optional TFTP logic)
app.get("/api/fetch-missing", (req, res) => {
  res.json({ fetched: [] }); // implement TFTP fetch here
});

app.listen(4000, () => console.log("Backend running on http://localhost:4000"));
