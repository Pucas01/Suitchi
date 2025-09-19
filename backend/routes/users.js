const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db"); // your db.js file that exports the sqlite3 db

const router = express.Router();

// POST /api/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: "Invalid username or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid username or password" });

    // optional: you could create a session here
    res.json({ success: true, user: { id: user.id, username: user.username } });
  });
});

module.exports = router;
