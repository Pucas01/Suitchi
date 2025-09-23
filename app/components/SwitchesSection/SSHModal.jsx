"use client";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import SSHTerminal from "./SSHTerminal";

export default function SSHModal({ visible, onClose, ip, tutorialSteps }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [startSSH, setStartSSH] = useState(false);
  const containerRef = useRef(null);

  const storageKey = `sshUsername_${ip}`;

  useEffect(() => {
    if (visible && !startSSH) {
      const savedUsername = localStorage.getItem(storageKey);
      if (savedUsername) setUsername(savedUsername);

      const inputs = containerRef.current?.querySelectorAll("input");
      if (inputs) {
        if (savedUsername) inputs[1]?.focus();
        else inputs[0]?.focus();
      }
    }
  }, [visible, startSSH, storageKey]);

  useEffect(() => {
    if (username) localStorage.setItem(storageKey, username);
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
        className={`bg-[#1A1A1F] p-6 rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden relative transition-transform duration-300 transform flex ${
          visible ? "scale-100" : "scale-95"
        }`}
      >
        {!startSSH ? (
          // Login form
          <div className="flex flex-col space-y-4 w-full">
            <h2 className="text-xl mb-4">Connect to {ip} via SSH</h2>
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
        ) : (
          <>
            {/* Tutorial sidebar */}
            {tutorialSteps && (
              <div className="w-1/3 pr-4 overflow-auto">
                <h3 className="text-lg font-semibold mb-2">Setup Tutorial</h3>
                <div className="space-y-4">
                  {tutorialSteps.map((step, i) => (
                    <div key={i}>
                      <p className="font-semibold">{step.title}</p>
                      {step.commands && (
                        <pre className="bg-[#2A2A35] p-2 rounded text-sm overflow-auto">
                          {step.commands.join("\n")}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SSH Terminal */}
            <div className="flex-1">
              <SSHTerminal host={ip} username={username} password={password} onClose={onClose} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
