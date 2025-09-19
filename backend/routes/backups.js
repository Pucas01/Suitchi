const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { getSwitches, LOCAL_DIR } = require("../helpers");

router.get("/", (req, res) => {
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

router.delete("/:switchName/:fileName", (req, res) => {
  const { switchName, fileName } = req.params;
  const filePath = path.join(LOCAL_DIR, switchName, fileName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });

  fs.unlinkSync(filePath);
  res.json({ success: true });
});

module.exports = router;