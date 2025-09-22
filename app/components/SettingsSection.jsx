"use client";

<div><Toaster/></div>

import { useState, useEffect } from "react";
import { Transition } from "@headlessui/react";
import UserManagement from "./SettingsUsers";
import toast, { Toaster } from 'react-hot-toast';

export default function SettingsSection({ refreshSwitches }) {
  const [switches, setSwitches] = useState([]);
  const [newSwitch, setNewSwitch] = useState({ name: "", ip: "", image: "", files: "", snmp: { enabled: false, community: "" } });
  const [loading, setLoading] = useState(false);
  const [editingSwitch, setEditingSwitch] = useState(null);
  const [tftpServer, setTftpServer] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // ------------------ Fetch User ------------------ //  
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch user", toastStyles);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const isAdmin = currentUser?.role === "admin";

  const toastStyles = {
    style: {
      borderRadius: '10px',
      background: '#1A1A1F',
      color: '#fff',
    },
  };

  const fetchSwitches = async () => {
    try {
      const res = await fetch("/api/switches", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch switches");
      const data = await res.json();
      setSwitches(data);
    } catch (err) {
      console.error(err);
      toast.error(`${err.message} - Failed to fetch switches`, toastStyles);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/tftp", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch config");
      const data = await res.json();
      setTftpServer(data.config?.tftpServer || "");
    } catch (err) {
      console.error(err);
      toast.error(`${err.message} - Failed to fetch TFTP config`, toastStyles);
    }
  };

  useEffect(() => {
    fetchSwitches();
    fetchConfig();
  }, []);

  const saveTftpServer = async () => {
    if (!tftpServer) return toast.error("TFTP Server IP required", toastStyles);
    try {
      const res = await fetch("/api/tftp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tftpServer }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(`${data.error || "Unknown error"} - Failed to save TFTP server`, toastStyles);
      } else {
        toast.success("TFTP Server Saved", toastStyles);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to save TFTP server`, toastStyles);
    }
  };

  const addSwitch = async () => {
    if (!newSwitch.name || !newSwitch.ip) return toast.error("Name and IP required", toastStyles);
    setLoading(true);
    try {
      const filesArray = newSwitch.files
        ? newSwitch.files.split(",").map(f => f.trim()).filter(Boolean)
        : [];

      const res = await fetch("/api/switches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...newSwitch, files: filesArray }),
      });

      if (!res.ok) {
        const errData = await res.json();
        toast.error(`${errData.error || "Failed to add switch"}`, toastStyles);
      } else {
        setNewSwitch({ name: "", ip: "", image: "", files: "", snmp: { enabled: true, community: "zabbix" } });
        fetchSwitches();
        refreshSwitches?.();
        toast.success("Switch added successfully", toastStyles);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add switch", toastStyles);
    } finally {
      setLoading(false);
    }
  };

  const deleteSwitch = async (name) => {
    // You can replace confirm() with Headless UI Dialog later
    if (!confirm(`Delete switch "${name}"? This will remove all backups.`)) return;
    try {
      const res = await fetch(`/api/switches/${name}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json();
        toast.error(`${errData.error || "Failed to delete switch"}`, toastStyles);
      } else {
        fetchSwitches();
        refreshSwitches?.();
        toast.success("Switch deleted", toastStyles);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete switch", toastStyles);
    }
  };

  const startEditing = (sw) => {
    setEditingSwitch({
      ...sw,
      files: sw.files ? sw.files.join(", ") : "",
      originalName: sw.name,
      snmp: sw.snmp || { enabled: true, community: "zabbix" },
    });
  };

  const cancelEditing = () => {
    setEditingSwitch(null);
  };

  const saveSwitch = async () => {
    if (!editingSwitch.name || !editingSwitch.ip) return toast.error("Name and IP required", toastStyles);
    setLoading(true);
    try {
      const filesArray = editingSwitch.files
        ? editingSwitch.files.split(",").map(f => f.trim()).filter(Boolean)
        : [];

      const res = await fetch(`/api/switches/${editingSwitch.originalName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...editingSwitch, files: filesArray }),
      });

      if (!res.ok) {
        const errData = await res.json();
        toast.error(`${errData.error || "Failed to update switch"}`, toastStyles);
      } else {
        setEditingSwitch(null);
        fetchSwitches();
        refreshSwitches?.();
        toast.success("Switch updated successfully", toastStyles);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update switch", toastStyles);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-6 bg-[#1A1A1F] rounded-xl space-y-6">
      {/* Add Switch */}
      <h2 className="text-2xl">Server Settings</h2>
      {/* isAdmin */}
      {isAdmin && (
      <div className="flex flex-col space-y-2 bg-[#1E1E23] p-4 rounded-xl">
        <h3 className="text-xl">Add a Switch</h3>
        <input
          value={newSwitch.name}
          onChange={(e) => setNewSwitch({ ...newSwitch, name: e.target.value })}
          placeholder="Switch Name"
          className="p-2 rounded-xl bg-[#1E1E23] text-white"
        />
        <input
          value={newSwitch.ip}
          onChange={(e) => setNewSwitch({ ...newSwitch, ip: e.target.value })}
          placeholder="IP Address"
          className="p-2 rounded-xl bg-[#1E1E23] text-white"
        />
        <input
          value={newSwitch.image}
          onChange={(e) => setNewSwitch({ ...newSwitch, image: e.target.value })}
          placeholder="Image URL (optional)"
          className="p-2 rounded-xl bg-[#1E1E23] text-white"
        />
        <input
          value={newSwitch.files}
          onChange={(e) => setNewSwitch({ ...newSwitch, files: e.target.value })}
          placeholder="Files to fetch (comma-separated)"
          className="p-2 rounded-xl bg-[#1E1E23] text-white"
        />
        {/* SNMP Settings */}
        <div className="flex items-center space-x-2">
          <label className="text-white">SNMP Enabled:</label>
          <input
            type="checkbox"
            checked={newSwitch.snmp.enabled}
            onChange={(e) => setNewSwitch({ ...newSwitch, snmp: { ...newSwitch.snmp, enabled: e.target.checked } })}
          />
          <input
            type="text"
            value={newSwitch.snmp.community}
            onChange={(e) => setNewSwitch({ ...newSwitch, snmp: { ...newSwitch.snmp, community: e.target.value } })}
            placeholder="Community String"
            className="p-1 rounded-xl bg-[#1A1E23] text-white flex-1"
          />
        </div>

        <button
          onClick={addSwitch}
          disabled={loading}
          className={`px-4 py-2 rounded-xl cursor-pointer transform text-white transition-colors duration-200 ${
            loading ? "bg-gray-500 cursor-not-allowed" : "bg-[#414562] hover:bg-[#545C80]"
          }`}
        >
          {loading ? "Adding..." : "Add Switch"}
        </button>
      </div>
      )}

{/* Existing Switches */}
<div className="space-y-2">
  <h3 className="text-xl">Existing Switches</h3>
  {switches.length === 0 && <p className="text-gray-400">No switches yet.</p>}
  <ul className="space-y-2">
    {switches.map((sw, index) => (
      <li
        key={sw.name + index}
        className="flex flex-col bg-[#1E1E23] p-2 rounded-xl"
      >
        {/* Display view or edit form */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img
              src={sw.image || "/images/cisco_switch.jpg"}
              alt={sw.name}
              className="h-8 w-8 rounded-xl"
            />
            <div>
              <p>{sw.name}</p>
              <p className="text-sm text-gray-400">{sw.ip}</p>
              {sw.files && sw.files.length > 0 && (
                <p className="text-sm text-gray-400">
                  Files: {sw.files.join(", ")}
                </p>
              )}
              {sw.snmp && (
                <p className="text-sm text-gray-400">
                  SNMP: {sw.snmp.enabled ? "Enabled" : "Disabled"} (Community:{" "}
                  {sw.snmp.community})
                </p>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  setEditingSwitch(
                    editingSwitch?.originalName === sw.name ? null : {
                      ...sw,
                      files: sw.files ? sw.files.join(", ") : "",
                      originalName: sw.name,
                      snmp: sw.snmp || { enabled: true, community: "zabbix" },
                    }
                  )
                }
                className="px-3 py-1 rounded-xl bg-[#414562] hover:bg-[#545C80] cursor-pointer transform text-white transition-colors duration-200"
              >
                {editingSwitch?.originalName === sw.name ? "Cancel" : "Edit"}
              </button>
              <button
                onClick={() => deleteSwitch(sw.name)}
                className="px-3 py-1 rounded-xl bg-[#414562] hover:bg-[#545C80] cursor-pointer transform text-white transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Animated Edit Form */}
        <div
          className={`flex flex-col space-y-1 mt-2 overflow-hidden transition-all duration-300 ${
            editingSwitch?.originalName === sw.name
              ? "max-h-[600px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          {editingSwitch?.originalName === sw.name && (
            <>
              <input
                value={editingSwitch.name}
                onChange={(e) =>
                  setEditingSwitch({ ...editingSwitch, name: e.target.value })
                }
                className="p-1 rounded-xl bg-[#1E1E23] text-white w-full"
              />
              <input
                value={editingSwitch.ip}
                onChange={(e) =>
                  setEditingSwitch({ ...editingSwitch, ip: e.target.value })
                }
                className="p-1 rounded-xl bg-[#1E1E23] text-white w-full"
              />
              <input
                value={editingSwitch.image}
                onChange={(e) =>
                  setEditingSwitch({ ...editingSwitch, image: e.target.value })
                }
                className="p-1 rounded-xl bg-[#1E1E23] text-white w-full"
              />
              <input
                value={editingSwitch.files}
                onChange={(e) =>
                  setEditingSwitch({ ...editingSwitch, files: e.target.value })
                }
                placeholder="Files to fetch (comma-separated)"
                className="p-1 rounded-xl bg-[#1E1E23] text-white w-full"
              />
              <div className="flex items-center space-x-2">
                <label className="text-white">SNMP Enabled:</label>
                <input
                  type="checkbox"
                  checked={editingSwitch.snmp.enabled}
                  onChange={(e) =>
                    setEditingSwitch({
                      ...editingSwitch,
                      snmp: { ...editingSwitch.snmp, enabled: e.target.checked },
                    })
                  }
                />
                <input
                  type="text"
                  value={editingSwitch.snmp.community}
                  onChange={(e) =>
                    setEditingSwitch({
                      ...editingSwitch,
                      snmp: { ...editingSwitch.snmp, community: e.target.value },
                    })
                  }
                  placeholder="Community String"
                  className="p-1 rounded-xl bg-[#1E1E23] text-white flex-1"
                />
              </div>
              <div className="flex space-x-2 mt-1">
                <button
                  onClick={saveSwitch}
                  className="px-3 py-1 rounded-xl bg-[#414562] hover:bg-[#545C80] cursor-pointer transform text-white transition-colors duration-200"
                >
                  Save
                </button>
                <button
                  onClick={cancelEditing}
                  className="px-3 py-1 rounded-xl bg-[#414562] hover:bg-[#545C80] cursor-pointer transform text-white transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </li>
    ))}
  </ul>
</div>


      {/* TFTP Server */}
      {isAdmin && (
      <div>
      <h3 className="text-xl">TFTP Server</h3>
      <div className="flex space-x-2 items-center">
        <input
          type="text"
          value={tftpServer}
          onChange={(e) => setTftpServer(e.target.value)}
          placeholder="TFTP Server IP"
          className="p-2 rounded-xl bg-[#1E1E23] text-white flex-1"
        />
        <button
          onClick={saveTftpServer}
          className="px-4 py-2 rounded-xl bg-[#414562] hover:bg-[#545C80] text-white cursor-pointer transform transition-colors duration-200"
        >
          Save
        </button>
      </div>
      <p className="text-gray-400 text-sm">Configure the TFTP server used to fetch missing backups.</p>
      </div>
      )}
  <UserManagement />

    </div>
  );
}

