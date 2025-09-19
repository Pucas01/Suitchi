const fs = require("fs");
const path = require("path");
const { LOCAL_DIR } = require("./helpers");

function parseACLFromFile(switchName, fileName) {
  const filePath = path.join(LOCAL_DIR, switchName, fileName);
  if (!fs.existsSync(filePath)) return [];

  const lines = fs.readFileSync(filePath, "utf-8").split(/\r?\n/);
  const aclBlocks = [];
  let currentAcl = null;
  let lineNumber = 1;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Start of a named ACL
    const aclMatch = line.match(/^ip access-list extended (.+)/);
    if (aclMatch) {
      currentAcl = { name: aclMatch[1], lines: [] };
      aclBlocks.push(currentAcl);
      lineNumber = 1;
      continue;
    }

    if (currentAcl) {
      const match = line.match(/^(permit|deny)\s+(\S+)\s+(.+)$/);
      if (match) {
        const [_, action, protocol, rest] = match;

        // Split rest into source, destination, and extras
        let src_host = "-", src_wildcard = "-", src_port = "-";
        let dst_host = "-", dst_wildcard = "-", dst_port = "-";
        let established = false;

        // Simple regex for typical ACL lines
        const parts = rest.split(/\s+/);
        // Source parsing
        if (parts[0] === "any") {
          src_host = "any";
          parts.shift();
        } else if (parts[0] === "host") {
          src_host = parts[1];
          parts.splice(0, 2);
        } else {
          src_host = parts[0];
          src_wildcard = parts[1] || "-";
          parts.splice(0, 2);
        }

        // Source port
        if (parts[0] && /^(eq|gt|lt|neq|range)$/.test(parts[0])) {
          src_port = parts[0] + " " + parts[1];
          parts.splice(0, 2);
        }

        // Destination parsing
        if (parts[0] === "any") {
          dst_host = "any";
          parts.shift();
        } else if (parts[0] === "host") {
          dst_host = parts[1];
          parts.splice(0, 2);
        } else {
          dst_host = parts[0];
          dst_wildcard = parts[1] || "-";
          parts.splice(0, 2);
        }

        // Destination port
        if (parts[0] && /^(eq|gt|lt|neq|range)$/.test(parts[0])) {
          dst_port = parts[0] + " " + parts[1];
          parts.splice(0, 2);
        }

        // Check for 'established' keyword
        if (parts.includes("established")) established = true;

        currentAcl.lines.push({
          line_number: lineNumber++,
          acl_name: currentAcl.name,
          action,
          protocol,
          src_host,
          src_wildcard,
          src_port,
          dst_host,
          dst_wildcard,
          dst_port,
          established
        });
      }
    }
  }

  // Flatten ACL blocks for DB storage
  return aclBlocks.flatMap(block =>
    block.lines.map(line => ({
      switch_name: switchName,
      file_name: fileName,
      ...line,
      raw_line: `${line.action} ${line.protocol} ${line.src_host} ${line.src_wildcard} ${line.src_port} ${line.dst_host} ${line.dst_wildcard} ${line.dst_port}${line.established ? " established" : ""}`
    }))
  );
}

module.exports = { parseACLFromFile };