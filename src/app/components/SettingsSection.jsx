"use client";

import { useState, useEffect } from "react";

export default function SettingsSection({ refreshSwitches }) {
  const [switches, setSwitches] = useState([]);
  const [newSwitch, setNewSwitch] = useState("");
  const [loading, setLoading] = useState(false);

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

  const addSwitch = async () => {
    if (!newSwitch) return;
    setLoading(true);
    try {
      await fetch("http://localhost:4000/api/switches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSwitch }),
      });
      setNewSwitch("");
      fetchSwitches();
      refreshSwitches();
    } catch (err) {
      console.error("Error adding switch:", err);
    }
    setLoading(false);
  };

  const deleteSwitch = async (name) => {
    if (!confirm(`Are you sure you want to delete switch "${name}"? This will also delete its backups.`)) return;
    try {
      await fetch(`http://localhost:4000/api/switches/${name}`, { method: "DELETE" });
      fetchSwitches();
      refreshSwitches();
    } catch (err) {
      console.error("Error deleting switch:", err);
    }
  };

  return (
    <div className="p-6 bg-[#1E1E23] rounded-xl">
      <h2 className="text-2xl mb-4">Settings</h2>

      <div className="flex space-x-2 mb-6">
        <input
          value={newSwitch}
          onChange={(e) => setNewSwitch(e.target.value)}
          placeholder="New switch name"
          className="p-2 rounded bg-[#2A2A30] text-white flex-1"
        />
        <button
          onClick={addSwitch}
          disabled={loading}
          className={`px-4 py-2 rounded ${
            loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          } text-white`}
        >
          Add
        </button>
      </div>

      <h3 className="text-xl mb-2">Existing Switches</h3>
      {switches.length === 0 && <p className="text-gray-400">No switches added yet.</p>}

      <ul className="space-y-2">
        {switches.map((sw) => (
          <li
            key={sw}
            className="flex justify-between items-center bg-[#2A2A30] p-2 rounded"
          >
            <span>{sw}</span>
            <button
              onClick={() => deleteSwitch(sw)}
              className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
