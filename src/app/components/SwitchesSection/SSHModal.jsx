"use client";
import toast from "react-hot-toast";
import { useState, useEffect, useRef } from "react";
import SSHTerminal from "./SSHTerminal";

export default function SSHModal({ visible, onClose, ip }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [startSSH, setStartSSH] = useState(false);
  const containerRef = useRef(null);

  const storageKey = `sshUsername_${ip}`; // unique per switch

  // Load stored username and focus the appropriate input
  useEffect(() => {
    if (visible && !startSSH) {
      const savedUsername = localStorage.getItem(storageKey);
      if (savedUsername) setUsername(savedUsername);

      const inputs = containerRef.current?.querySelectorAll("input");
      if (inputs) {
        if (savedUsername) {
          // Username is filled, focus password
          inputs[1]?.focus();
        } else {
          // Focus username
          inputs[0]?.focus();
        }
      }
    }
  }, [visible, startSSH, storageKey]);

  // Save username when it changes
  useEffect(() => {
    if (username) {
      localStorage.setItem(storageKey, username);
    }
  }, [username, storageKey]);

  const handleConnect = () => {
    if (!username || !password) {
      toast.error("Please enter both username and password", {
        style: { borderRadius: "10px", background: "#1A1A1F", color: "#fff" },
      });
      return;
    }
    setStartSSH(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleConnect();
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300 ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={containerRef}
        className={`bg-[#1A1A1F] p-6 rounded-xl max-w-4xl w-full max-h-[95vh] overflow-auto relative transition-transform duration-300 transform ${
          visible ? "scale-100" : "scale-95"
        }`}
      >
        {/* Form */}
        <div
          className={`transition-opacity duration-300 ${
            startSSH ? "opacity-0 pointer-events-none absolute inset-0" : "opacity-100 relative"
          }`}
        >
          <h2 className="text-xl mb-4">Connect to {ip} via SSH</h2>
          <div className="flex flex-col space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="p-2 rounded-xl bg-[#1E1E23] text-white outline-none"
              onKeyDown={handleKeyPress}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-2 rounded-xl bg-[#1E1E23] text-white outline-none"
              onKeyDown={handleKeyPress}
            />
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-[#414562] hover:bg-[#545C80] text-white rounded-xl"
            >
              Connect
            </button>
          </div>
        </div>

        {/* SSH Terminal */}
        <div
          className={`transition-opacity duration-300 ${
            startSSH ? "opacity-100 relative" : "opacity-0 pointer-events-none absolute inset-0"
          }`}
        >
          {startSSH && <SSHTerminal host={ip} username={username} password={password} onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}
