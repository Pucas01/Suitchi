// backend/sshServer.js
const { Server } = require("ws");
const { Client } = require("ssh2");

function initSSHServer(server) {
  const wss = new Server({ server, path: "/ssh" });

  wss.on("connection", (ws) => {
    let sshConn = new Client();

    ws.on("message", (msg) => {
      const data = JSON.parse(msg);

      if (data.type === "connect") {
        sshConn.on("ready", () => {
          sshConn.shell((err, stream) => {
            if (err) return ws.send(JSON.stringify({ type: "error", message: err.message }));

            stream.on("data", (chunk) => {
              ws.send(JSON.stringify({ type: "data", data: chunk.toString("utf-8") }));
            });

            ws.on("message", (input) => {
              try {
                const i = JSON.parse(input);
                if (i.type === "input") {
                  stream.write(i.data);
                }
              } catch {}
            });
          });
        });

        sshConn.on("error", (err) => {
          ws.send(JSON.stringify({ type: "error", message: err.message }));
        });

        sshConn.connect({
          host: data.host,
          port: 22,
          username: data.username,
          password: data.password,
        });
      }
    });

    ws.on("close", () => {
      if (sshConn) sshConn.end();
    });
  });
}

module.exports = { initSSHServer };
