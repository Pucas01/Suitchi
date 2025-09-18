"use client";

import { useState } from "react";
import SwitchesSection from "./components/SwitchesSection";
import ACLviewer from "./components/ACLviewer";
import SettingsSection from "./components/SettingsSection";

export default function Page() {
  const [active, setActive] = useState("Switches");

  // optional: track button animation state if you want JS-controlled pop
  const [popping, setPopping] = useState(null);

  const handleClick = (name) => {
    setPopping(name);
    setActive(name);
    setTimeout(() => setPopping(null), 200); // match animation duration
  };

  return (
    <div className="flex min-h-screen bg-[#1A1A1F] text-white">
      {/* Sidebar */}
      <aside className="w-56 h-screen bg-[#15151A] p-6 flex flex-col justify-between">
        <div className="space-y-2">
          <button
            onClick={() => handleClick("Switches")}
            className={`p-3 text-lg rounded-xl text-center w-full transition-colors duration-200 cursor-pointer transform ${
              active === "Switches"
                ? "bg-[#545C80]"
                : "bg-[#414562] hover:bg-[#545C80]"
            } ${popping === "Switches" ? "animate-pop" : ""}`}
          >
          <img src="/images/cisco_switch.jpg" className="rounded-xl" />
          <span className="block pt-2">"SwitchName"</span>
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => handleClick("ACL")}
            className={`p-3 text-lg rounded-xl text-center w-full transition-colors duration-200 cursor-pointer transform ${
              active === "ACL"
                ? "bg-[#545C80]"
                : "bg-[#414562] hover:bg-[#545C80]"
            } ${popping === "ACL" ? "animate-pop" : ""}`}
          >
            ACL
          </button>
          <button
            onClick={() => handleClick("Settings")}
            className={`p-3 text-lg rounded-xl text-center w-full transition-colors duration-200 cursor-pointer transform ${
              active === "Settings"
                ? "bg-[#545C80]"
                : "bg-[#414562] hover:bg-[#545C80]"
            } ${popping === "Settings" ? "animate-pop" : ""}`}
          >
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-[#15151A] pt-6 h-screen overflow-hidden">
        {active === "Switches" && <SwitchesSection />}
        {active === "ACL" && <ACLviewer />}
        {active === "Settings" && <SettingsSection />}
      </main>
    </div>
  );
}
