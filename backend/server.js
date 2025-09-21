const express = require("express");
const cors = require("cors");
const http = require("http");
const session = require("express-session");
const switchesRoutes = require("./routes/switches");
const backupsRoutes = require("./routes/backups");
const tftpRoutes = require("./routes/tftp");
const aclRoutes = require("./routes/acl");
const snmpRoutes = require("./routes/snmp");
const usersRoutes = require("./routes/users");
const requireAuth = require("./authMiddleware");
const { LOCAL_DIR } = require("./helpers");
const { initSSHServer } = require("./sshServer");
const os = require("os");

const app = express();

// --- Middleware ---
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

require("dotenv").config();

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60,
  }
}));

// --- Routes ---
app.use("/api/switches", requireAuth, switchesRoutes);
app.use("/api/backups", requireAuth, backupsRoutes);
app.use("/api/tftp", requireAuth, tftpRoutes);
app.use("/api/acl", requireAuth, aclRoutes);
app.use("/api/snmp", requireAuth, snmpRoutes);
app.use("/api/users", usersRoutes);

// Protect downloads
app.use("/downloads", requireAuth, express.static(LOCAL_DIR));

// --- Server startup ---
const PORT = 4000;
const HOST = "0.0.0.0";

// Create one HTTP server and attach WS to it
const server = http.createServer(app);
initSSHServer(server); // attach WebSocket server

server.listen(PORT, HOST, () => {
  const interfaces = os.networkInterfaces();
  let serverIP = "localhost";
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        serverIP = iface.address;
        break;
      }
    }
  }
  console.log(`🚀 Backend running on http://${serverIP}:${PORT}`);
});
