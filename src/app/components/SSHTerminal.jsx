"use client";

import { useEffect, useRef } from "react";
import "@xterm/xterm/css/xterm.css";

export default function SSHTerminal({ host, username, password, onClose }) {
  const terminalRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    let term, fitAddon;

    (async () => {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");

      term = new Terminal({
        theme: { background: "#1E1E23" },
        cursorBlink: true,
        fontSize: 14,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      term.open(terminalRef.current);

      // Fit after render cycle
      setTimeout(() => {
        fitAddon.fit();
      }, 0);

      // WebSocket connection
      const ws = new WebSocket(`ws://localhost:4000/ssh`);

      ws.onopen = () => {
        console.log("✅ Connected to SSH WebSocket");
        ws.send(JSON.stringify({ type: "connect", host, username, password }));
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === "data") term.write(data.data);
          if (data.type === "error") {
            term.write(`\r\nError: ${data.message}\r\n`);
          }
        } catch (err) {
          console.error("Invalid WS message:", msg.data, err);
        }
      };

      ws.onerror = (err) => {
        term.write("\r\n❌ WebSocket error\r\n");
        console.error("WebSocket error:", err);
      };

      ws.onclose = () => {
        term.write("\r\n🔌 Connection closed\r\n");
      };

      term.onData((input) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "input", data: input }));
        }
      });

      wsRef.current = ws;

      // Cleanup
      return () => {
        window.removeEventListener("resize", handleResize);
        ws.close();
        term.dispose();
      };
    })();

    return () => {
      wsRef.current?.close();
    };
  }, [host, username, password]);

  return (
    <div className="w-full max-h-[800px] bg-black rounded overflow-hidden relative">
      <div ref={terminalRef} className="w-full h-full" />
      <button
        onClick={onClose}
        className="absolute top-2 right-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >
        Close
      </button>
    </div>
  );
}
