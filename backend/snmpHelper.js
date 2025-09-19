const snmp = require("net-snmp");

const UPTIME_OID = "1.3.6.1.2.1.1.3.0";
const HOSTNAME_OID = "1.3.6.1.2.1.1.5.0";
const MODEL_OID = "1.3.6.1.2.1.1.1.0";

// Fetch SNMP data
async function fetchSNMPData(host, community = "zabbix") {
  return new Promise((resolve, reject) => {
    const session = snmp.createSession(host, community);

    session.get([UPTIME_OID, HOSTNAME_OID, MODEL_OID], (error, varbinds) => {
      session.close();
      if (error) return reject(error);

      const parseVar = (vb) => snmp.isVarbindError(vb) ? null : vb.value.toString();

      const uptimeCs = parseVar(varbinds[0]);
      const uptimeSeconds = uptimeCs ? Math.floor(parseInt(uptimeCs) / 100) : null;

      const hostname = parseVar(varbinds[1]);

      // Clean up model field
      const rawModel = parseVar(varbinds[2]) || "";
      const model = rawModel.match(/\(([^)]+)\)/)?.[1] || rawModel.split(',')[2]?.trim() || rawModel;

      resolve({ uptimeSeconds, hostname, model });
    });
  });
}

module.exports = { fetchSNMPData };