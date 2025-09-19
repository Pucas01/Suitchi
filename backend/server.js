const express = require("express");
const cors = require("cors");
const session = require("express-session");
const switchesRoutes = require("./routes/switches");
const backupsRoutes = require("./routes/backups");
const tftpRoutes = require("./routes/tftp");
const aclRoutes = require("./routes/acl");
const snmpRoutes = require("./routes/snmp");
const usersRoutes = require("./routes/users");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/switches", switchesRoutes);
const { LOCAL_DIR } = require("./helpers");
app.use("/downloads", express.static(LOCAL_DIR));
app.use("/api", tftpRoutes);
app.use("/api/acl", aclRoutes);
app.use("/api/snmp", snmpRoutes);
app.use("/api/backups", backupsRoutes)
app.use("/api", usersRoutes);


const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
