const express = require("express");
const router = express.Router();
const { getSwitches } = require("../helpers");
const { fetchSNMPData } = require("../snmpHelper");


// SNMP endpoint
router.get("/:switchName", async (req, res) => {
  const { switchName } = req.params;
  const sw = getSwitches().find(s => s.name === switchName);
  if (!sw) return res.status(404).json({ error: "Switch not found" });

  if (!sw.snmp?.enabled) {
    return res.json({ uptimeSeconds: null, hostname: null, model: null, status: "disabled" });
  }

  try {
    const { uptimeSeconds, hostname, model } = await fetchSNMPData(sw.ip, sw.snmp.community);
    const status = uptimeSeconds !== null ? "online" : "offline";
    res.json({ uptimeSeconds, hostname, model, status });
  } catch (err) {
    console.error("SNMP error:", err);
    res.json({ uptimeSeconds: null, hostname: null, model: null, status: "offline" });
  }
});

module.exports = router;