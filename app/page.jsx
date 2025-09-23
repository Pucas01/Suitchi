"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SwitchesSection from "./components/SwitchesSection";
import ACLviewer from "./components/ACLviewer";
import SettingsSection from "./components/SettingsSection";

export default function Page() {
  const [active, setActive] = useState(null);
  const [popping, setPopping] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [switches, setSwitches] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();


  // ---------------- Auth Guard ----------------
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/users/me", { credentials: "include" });
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error(err);
        router.replace("/login");
      }
    };

    checkAuth();
  }, [router]);

// ---------------- Fetch Switches ----------------
const fetchSwitches = async () => {
  try {
    const res = await fetch("/api/switches", { credentials: "include" }); 
    if (res.status === 401) {
      router.replace("/login");
      return;
    }

    const data = await res.json();
    setSwitches(data);
  } catch (err) {
    console.error("Error fetching switches:", err);
    router.replace("/login");
  }
};

useEffect(() => {
  fetchSwitches();
}, []);

// ---------------- Auto-select first switch ----------------
useEffect(() => {
  if (switches.length > 0 && !active) {
    setActive(switches[0]); 
  }
}, [switches, active]);

  // ---------------- Navigation ----------------
  const handleClick = (sw) => {
    const swName = typeof sw === "string" ? sw : sw.name;
    const activeName = typeof active === "string" ? active : active?.name;

    if (activeName === swName) return;

    setPopping(swName);
    setTransitioning(true);

    setTimeout(() => {
      setActive(sw);
      setTransitioning(false);
      setPopping(null);
    }, 200);
  };

  // ---------------- Logout ----------------
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/users/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Logout failed");

      setUser(null);
      router.replace("/login");
    } catch (err) {
      console.error(err);
      alert("Failed to log out");
    }
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
        <div
          className={`transition-opacity duration-200 ${
            transitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          {!active && (
            <div className="flex flex-col items-center h-screen text-center space-y-4 p-6 bg-[#1A1A1F] rounded-xl">
              <div className="bg-[#1E1E23] rounded-xl p-6 text-center flex flex-col items-center w-full space-y-4">
              <h2 className="text-5xl font-semibold">Welcome!</h2>
              <p className="text-gray-400 text-2xl max-w-md">
                First things you should do:
              </p>
              <ul className="text-gray-400 text-1xl space-y-1 max-w-md list-disc list-inside text-left">
                <li>Change the default admin password</li>
                <li>Set a TFTP Server address</li>
                <li>Add a switch</li>
              </ul>
              <p className="text-gray-400 max-w-md">
                All of this can be done on the {" "}
                <span className="font-semibold">Settings</span> page.
              </p>
              </div>
            </div>
          )}

          {switches.map(
            (sw) =>
              active?.name === sw.name && (
                <SwitchesSection key={sw.name} switchData={sw} />
              )
          )}

          {active === "ACL" && <ACLviewer />}
          {active === "Settings" && (
            <SettingsSection refreshSwitches={fetchSwitches} />
          )}
        </div>
      </main>
    </div>
  );
}
