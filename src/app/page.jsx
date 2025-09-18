"use client";

import { useEffect, useState } from "react";
import SwitchesSection from "./components/SwitchesSection";
import ACLviewer from "./components/ACLviewer";
import SettingsSection from "./components/SettingsSection";

export default function Page() {
  const [active, setActive] = useState(null); // active switch or ACL/Settings
  const [popping, setPopping] = useState(null);
  const [switches, setSwitches] = useState([]);

  // Fetch switches from backend
  const fetchSwitches = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/switches");
      const data = await res.json();
      setSwitches(data);
    } catch (err) {
      console.error("Error fetching switches:", err);
    }
  };

  useEffect(() => {
    fetchSwitches();
  }, []);

  const handleClick = (name) => {
    setPopping(name);
    setActive(name);
    setTimeout(() => setPopping(null), 200);
  };

  return (
    <div className="flex min-h-screen bg-[#1A1A1F] text-white">
      {/* Sidebar */}
      <aside className="w-56 h-screen bg-[#121217] p-6 flex flex-col justify-between">
        <div className="space-y-2">
          {switches.map((sw) => (
            <button
              key={sw}
              onClick={() => handleClick(sw)}
              className={`p-3 text-lg rounded-xl text-center w-full transition-colors duration-200 cursor-pointer transform ${
                active === sw ? "bg-[#545C80]" : "bg-[#414562] hover:bg-[#545C80]"
              } ${popping === sw ? "animate-pop" : ""}`}
            >
              <img src="/images/cisco_switch.jpg" className="rounded-xl" />
              <span className="block pt-2">{sw}</span>
            </button>
          ))}
        </div>

        <div className="space-y-2 mt-6">
          <button
            onClick={() => handleClick("ACL")}
            className={`p-3 text-lg rounded-xl text-center w-full transition-colors duration-200 cursor-pointer transform ${
              active === "ACL" ? "bg-[#545C80]" : "bg-[#414562] hover:bg-[#545C80]"
            } ${popping === "ACL" ? "animate-pop" : ""}`}
          >
            ACL
          </button>
          <button
            onClick={() => handleClick("Settings")}
            className={`p-3 text-lg rounded-xl text-center w-full transition-colors duration-200 cursor-pointer transform ${
              active === "Settings" ? "bg-[#545C80]" : "bg-[#414562] hover:bg-[#545C80]"
            } ${popping === "Settings" ? "animate-pop" : ""}`}
          >
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-[#121217] pt-6 h-screen overflow-auto px-6">
        {!active && (
          <p className="text-gray-400">Select a switch to view backups.</p>
        )}
        {switches.map(
          (sw) => active === sw && <SwitchesSection key={sw} switchName={sw} />
        )}
        {active === "ACL" && <ACLviewer />}
        {active === "Settings" && (
          <SettingsSection refreshSwitches={fetchSwitches} />
        )}
      </main>
    </div>
  );
}
