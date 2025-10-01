const fs = require("fs");
const path = require("path");

const CONFIG_DIR = path.join(__dirname, "config");
const LOCAL_DIR = path.join(__dirname, "downloads");

if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

if (!fs.existsSync(LOCAL_DIR)) {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

const SWITCHES_FILE = path.join(CONFIG_DIR, "switches.json");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const getSwitches = () => (fs.existsSync(SWITCHES_FILE) ? JSON.parse(fs.readFileSync(SWITCHES_FILE, "utf-8")) : []);
const saveSwitches = (switches) => fs.writeFileSync(SWITCHES_FILE, JSON.stringify(switches, null, 2));
const getConfig = () => (fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")) : { tftpServer: "" });
const saveConfig = (config) => fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

const normalizeFiles = (files, fallbackName) => {
  if (Array.isArray(files)) return files.filter(Boolean);
  if (typeof files === "string") return files.split(",").map(f => f.trim()).filter(Boolean);
  return ["startup-config", "running-config"];
};


module.exports = { LOCAL_DIR, getSwitches, saveSwitches, getConfig, saveConfig, normalizeFiles };