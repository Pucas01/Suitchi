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
            if (err) {
              return ws.send(JSON.stringify({ type: "error", message: err.message }));
            }

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
            algorithms: {
              kex: [
                "diffie-hellman-group1-sha1",
                "diffie-hellman-group14-sha1",
                "diffie-hellman-group14-sha256",
                "diffie-hellman-group16-sha512",
                "curve25519-sha256",
                "curve25519-sha256@libssh.org"
              ],
              cipher: [
                "aes128-ctr","aes192-ctr","aes256-ctr",
                "aes128-gcm","aes256-gcm",
                "chacha20-poly1305@openssh.com",
                "3des-cbc"
              ],
              hmac: [
                "hmac-sha1","hmac-md5",
                "hmac-sha2-256","hmac-sha2-512"
              ],
              serverHostKey: [
                "ssh-rsa","rsa-sha2-256","rsa-sha2-512",
                "ssh-ed25519","ssh-dss"
              ]
          }
        });
      }
    });

    ws.on("close", () => {
      if (sshConn) sshConn.end();
    });
  });
}

module.exports = { initSSHServer };
