const express = require("express");
const cors = require("cors");
const session = require("express-session");
const switchesRoutes = require("./routes/switches");
const backupsRoutes = require("./routes/backups");
const tftpRoutes = require("./routes/tftp");
const aclRoutes = require("./routes/acl");
const snmpRoutes = require("./routes/snmp");
const usersRoutes = require("./routes/users");
const requireAuth = require("./authMiddleware");
const { LOCAL_DIR } = require("./helpers");
const os = require("os");

const app = express();

// --- Middleware ---
app.use(cors({
  origin: "http://localhost:3000", // frontend URL
  credentials: true,               // allow cookies
}));
app.use(express.json());

app.use(session({
  secret: "supersecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // true if using HTTPS
    maxAge: 1000 * 60 * 60, // 1 hour
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

function getServerIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

app.listen(PORT, HOST, () => {
  const serverIP = getServerIP();
  console.log(`🚀 Backend running on http://${serverIP}:${PORT}`);
});
