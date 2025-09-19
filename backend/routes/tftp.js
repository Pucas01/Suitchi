const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const tftp = require("tftp");
const { getSwitches, getConfig, saveConfig, normalizeFiles, LOCAL_DIR } = require("../helpers");


router.get("/config/tftp", (req, res) => res.json({ config: getConfig() }));
router.put("config/tftp", (req, res) => {
  const { tftpServer } = req.body;
  if (!tftpServer) return res.status(400).json({ error: "TFTP server IP required" });
  const config = getConfig();
  config.tftpServer = tftpServer;
  saveConfig(config);
  res.json({ success: true, config });
});

router.get("/fetch-missing/:switchName", async (req, res) => {
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

module.exports = router;