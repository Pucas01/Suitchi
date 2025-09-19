const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { getSwitches, saveSwitches, normalizeFiles, LOCAL_DIR } = require("../helpers");

// GET /api/switches
router.get("/", (req, res) => res.json(getSwitches()));

// POST /api/switches
router.post("/", (req, res) => {
  const { name, ip, image, files, snmp } = req.body;
  if (!name || !ip) return res.status(400).json({ error: "Name and IP required" });

  let switches = getSwitches();
  if (switches.find(sw => sw.name === name)) return res.status(400).json({ error: "Switch already exists" });

  const newSwitch = {
    name,
    ip,
    image: image || "/images/cisco_switch.jpg",
    files: normalizeFiles(files, name),
    snmp: snmp || { enabled: true, community: "zabbix", version: "2c" }
  };
  switches.push(newSwitch);
  saveSwitches(switches);

  fs.mkdirSync(path.join(LOCAL_DIR, name), { recursive: true });
  res.json({ success: true, switch: newSwitch });
});

// DELETE /api/switches/:name
router.delete("/:name", (req, res) => {
  let switches = getSwitches();
  const { name } = req.params;
  if (!switches.find(sw => sw.name === name)) return res.status(404).json({ error: "Switch not found" });

  switches = switches.filter(sw => sw.name !== name);
  saveSwitches(switches);

  const dir = path.join(LOCAL_DIR, name);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });

  res.json({ success: true });
});

// PUT /api/switches/:name
router.put("/:name", (req, res) => {
  const { name } = req.params;
  const { name: newName, ip, image, files, snmp } = req.body;

  let switches = getSwitches();
  const index = switches.findIndex(sw => sw.name === name);
  if (index === -1) return res.status(404).json({ error: "Switch not found" });

  const oldName = switches[index].name;
  switches[index] = {
    name: newName,
    ip,
    image,
    files: normalizeFiles(files, newName),
    snmp: snmp || switches[index].snmp || { enabled: true, community: "zabbix", version: "2c" }
  };
  saveSwitches(switches);

  const oldDir = path.join(LOCAL_DIR, oldName);
  const newDir = path.join(LOCAL_DIR, newName);
  if (oldName !== newName && fs.existsSync(oldDir)) fs.renameSync(oldDir, newDir);

  res.json({ success: true, switch: switches[index] });
});

module.exports = router;
