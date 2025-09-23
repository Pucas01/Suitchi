const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const tftp = require("tftp");
const { getSwitches, getConfig, normalizeFiles, LOCAL_DIR } = require("../helpers");

// GET current TFTP server config
router.get("/", (req, res) => {
  try {
    const config = getConfig();
    res.json({ config });
  } catch (err) {
    console.error("Failed to fetch TFTP config:", err);
    res.status(500).json({ error: "Failed to fetch config" });
  }
});


// PUT to update TFTP server IP
router.put("/", (req, res) => {
  const { tftpServer } = req.body;
  if (!tftpServer) return res.status(400).json({ error: "TFTP server IP required" });

  try {
    const config = getConfig();
    config.tftpServer = tftpServer;
    fs.writeFileSync(path.join(__dirname, "../config.json"), JSON.stringify(config, null, 2));
    res.json({ success: true, config });
  } catch (err) {
    console.error("Failed to update TFTP config:", err);
    res.status(500).json({ error: "Failed to update config" });
  }
});

// Fetch missing backups for a switch
router.get("/fetch-missing/:switchName", async (req, res) => {
  const { switchName } = req.params;
  const switches = getSwitches();
  const config = getConfig();
  const sw = switches.find((s) => s.name === switchName);

  if (!sw) return res.status(404).json({ error: "Switch not found" });
  if (!config.tftpServer) return res.status(400).json({ error: "TFTP server not configured" });

  const fetched = [];
  try {
    const switchDir = path.join(LOCAL_DIR, sw.name);
    fs.mkdirSync(switchDir, { recursive: true });

    const client = tftp.createClient({
      host: config.tftpServer,
      port: 69,
      timeout: 10000,
    });

    for (const filename of normalizeFiles(sw.files, sw.name)) {
      if (!filename) continue;

      const destFile = path.join(switchDir, path.basename(filename));

      await new Promise((resolve, reject) => {
        console.log(`[TFTP] Downloading '${filename}' to '${destFile}'...`);

        client.get(filename, destFile, (err, size) => {
          if (err) {
            console.error(`[TFTP] FAILED to download '${filename}':`, err);
            fs.unlink(destFile, () => reject(err));
            return;
          }

          console.log(`[TFTP] SUCCESS downloading '${filename}'. Size: ${size} bytes.`);

          if (size === 0) {
            console.warn(`[TFTP] ATTENTION: The downloaded file '${filename}' is empty on the server.`);
          }

          resolve();
        });
      });

      fetched.push({ switch: sw.name, file: path.basename(destFile) });
    }

    res.json({ fetched });
  } catch (err) {
    console.error("TFTP fetch final error:", err);
    res.status(500).json({ error: err.message, fetched });
  }
});

module.exports = router;
