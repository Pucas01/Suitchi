"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SwitchesSection from "./components/SwitchesSection";
import ACLviewer from "./components/ACLviewer";
import SettingsSection from "./components/SettingsSection";

export default function Page() {
  const [active, setActive] = useState(null); // switch object or "ACL"/"Settings"
  const [popping, setPopping] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [switches, setSwitches] = useState([]);
  const router = useRouter();

  // ---------------- Auth Guard ----------------
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login"); // redirect if not logged in
    }
  }, []);

  if (!localStorage.getItem("user")) return null; // prevent flicker

  // ---------------- Fetch Switches ----------------
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

  // ---------------- Navigation ----------------
  const handleClick = (sw) => {
    const swName = typeof sw === "string" ? sw : sw.name;
    const activeName = typeof active === "string" ? active : active?.name;

    if (activeName === swName) return; // same page, do nothing

    setPopping(swName);
    setTransitioning(true);

    setTimeout(() => {
      setActive(sw);
      setTransitioning(false);
      setPopping(null);
    }, 200); // match transition duration
  };

  // ---------------- Logout ----------------
  const handleLogout = () => {
    localStorage.removeItem("user");
    router.replace("/login");
  };

  // ---------------- Render ----------------
  return (
    <div className="flex min-h-screen bg-[#1A1A1F] text-white">
      {/* Sidebar */}
      <aside className="w-56 h-screen bg-[#121217] flex flex-col">
        <div className="flex-1 overflow-y-auto pl-6 pt-6 space-y-2">
          {switches.map((sw) => (
            <button
              key={sw.name}
              onClick={() => handleClick(sw)}
              className={`w-full p-2 py-2 text-lg rounded-xl text-center transition-colors duration-200 cursor-pointer transform ${
                active?.name === sw.name ? "bg-[#545C80]" : "bg-[#414562] hover:bg-[#545C80]"
              } ${popping === sw.name ? "animate-pop" : ""}`}
            >
              <img
                src={sw.image || "/images/cisco_switch.jpg"}
                className="rounded-xl w-full"
                alt={sw.name}
                draggable="false"
              />
              <span className="block pt-2">{sw.name}</span>
              <p className="text-xs text-gray-400">{sw.ip}</p>
            </button>
          ))}
        </div>

        <div className="pl-6 pb-6 pt-6 space-y-2">
          <button
            onClick={() => handleClick("ACL")}
            className={`w-full px-4 py-2 text-lg rounded-xl text-center transition-colors duration-200 cursor-pointer transform ${
              active === "ACL" ? "bg-[#545C80]" : "bg-[#414562] hover:bg-[#545C80]"
            } ${popping === "ACL" ? "animate-pop" : ""}`}
          >
            ACL
          </button>
          <button
            onClick={() => handleClick("Settings")}
            className={`w-full px-4 py-2 text-lg rounded-xl text-center transition-colors duration-200 cursor-pointer transform ${
              active === "Settings" ? "bg-[#545C80]" : "bg-[#414562] hover:bg-[#545C80]"
            } ${popping === "Settings" ? "animate-pop" : ""}`}
          >
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-lg rounded-xl text-center transition-colors duration-200 cursor-pointer transform bg-[#414562] hover:bg-[#545C80]"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-[#121217] pt-6 h-screen overflow-auto px-6 relative">
        <div className={`transition-opacity duration-200 ${transitioning ? "opacity-0" : "opacity-100"}`}>
          {!active && <p className="text-gray-400">Select a switch to view backups.</p>}

          {switches.map(
            (sw) =>
              active?.name === sw.name && (
                <SwitchesSection
                  key={sw.name}
                  switchData={sw} // full object {name, ip, image}
                />
              )
          )}

          {active === "ACL" && <ACLviewer />}
          {active === "Settings" && <SettingsSection refreshSwitches={fetchSwitches} />}
        </div>
      </main>
    </div>
  );
}
