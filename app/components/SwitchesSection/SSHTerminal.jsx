"use client";

import { useEffect, useRef } from "react";
import "@xterm/xterm/css/xterm.css";

export default function SSHTerminal({ host, username, password, onClose }) {
  const terminalRef = useRef(null);
  const wsRef = useRef(null);
  const termRef = useRef(null);

  useEffect(() => {
    let fitAddon;

    const { Terminal } = require("@xterm/xterm");
    const { FitAddon } = require("@xterm/addon-fit");

    const term = new Terminal({
      theme: { background: "#1E1E23" },
      cursorBlink: true,
      fontSize: 14,
    });

    fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    if (!terminalRef.current) return;

    term.open(terminalRef.current);

    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (err) {
        console.error("FitAddon error:", err);
      }
    }, 0);

    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch {}
    };
    window.addEventListener("resize", handleResize);

    // ---------------- WebSocket ----------------
    const ws = new WebSocket(`ws://${window.location.hostname}:4000/ssh`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "connect", host, username, password }));
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === "data") term.write(data.data);
        if (data.type === "error") term.write(`\r\nError: ${data.message}\r\n`);
      } catch {}
    };

    ws.onerror = () => {
      term.write("\r\n❌ WebSocket error\r\n");
    };

    ws.onclose = () => {
      term.write("\r\n🔌 Connection closed\r\n");
    };

    term.onData((input) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data: input }));
      }
    });

    termRef.current = term;
    wsRef.current = ws;

    return () => {
      window.removeEventListener("resize", handleResize);
      ws.close();
      if (term) term.dispose();
    };
  }, [host, username, password]);

  return (
    <div className="w-full h-[85vh] bg-[#1E1E23]} rounded overflow-hidden relative">
      <div ref={terminalRef} className="w-full h-[85vh]" />
      <button
        onClick={onClose}
        className="absolute top-2 right-2 px-3 py-1 text-white rounded-xl bg-[#414562] hover:bg-[#545C80] transition-colors duration-200 cursor-pointer"
      >
        Close
      </button>
    </div>
  );
}
