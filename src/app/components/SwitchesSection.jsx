"use client";

<div><Toaster/></div>

import { useState, useEffect } from "react";
import toast, { Toaster } from 'react-hot-toast';

export default function SwitchesSection({ switchData }) {
  const { name, ip, image } = switchData;

  // ---------------- States ----------------
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [deletingFile, setDeletingFile] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
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
  }
};

useEffect(() => {
  fetchCurrentUser();
}, []);

const isAdmin = currentUser?.role === "admin";

  const [snmpData, setSnmpData] = useState({
    uptimeSeconds: null,
    hostname: "-",
    model: "-",
    status: switchData.snmp?.enabled ? "unknown" : "disabled",
  });
  const [loadingUptime, setLoadingUptime] = useState(false);

  // ---------------- Helpers ----------------
  function formatUptime(seconds) {
    if (seconds === null) return "-";
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  // ---------------- Fetch Functions ----------------
  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/backups", { credentials: "include" });
      const data = await res.json();
      setBackups(data[name] || []);
    } catch (err) {
      console.error("Error fetching backups:", err);
      setBackups([]);
    }
  };

  const fetchMissingBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch(`/api/tftp/fetch-missing/${name}`, { credentials: "include" });
      if (!res.ok) {
        const errData = await res.json();
      toast.error(`${errData.error || "Unknown error"} - Failed to fetch missing backups`, {
      style: {
        borderRadius: '10px',
        background: '#1A1A1F',
        color: '#fff',
        },
      });
      }
      await fetchBackups();
    } catch (err) {
      console.error("Error fetching missing backups:", err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const deleteBackup = async (fileName) => {
    if (!confirm(`Delete "${fileName}" for switch ${name}?`)) return;
    setDeletingFile(fileName);
    try {
      const res = await fetch(`/api/backups/${name}/${fileName}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json();
        toast.error(errData.error || "Failed to delete file",
      {
      style: {
        borderRadius: '10px',
        background: '#1A1A1F',
        color: '#fff',
          },
        });
      } else {
        await fetchBackups();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingFile(null);
    }
  };

const viewFile = async (fileName) => {
  const fileUrl = `/downloads/${name}/${fileName}`;

  try {
    const res = await fetch(fileUrl, { credentials: "include" }); // 👈 include session cookie

    if (res.status === 401) {
      // Not logged in anymore → kick back to login
      window.location.href = "/login";
      return;
    }

    if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

    if (fileName.endsWith(".txt") || fileName.endsWith(".cfg")) {
      const text = await res.text();
      setFileContent(text);
    } else {
      toast.error("Unsupported file type for preview",
      {
      style: {
        borderRadius: '10px',
        background: '#1A1A1F',
        color: '#fff',
          },
        });
      return;
    }

    setViewingFile(fileName);
    setModalVisible(true);

  } catch (err) {
    console.error(err);
    alert("Failed to load file");
  }
};

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setViewingFile(null);
      setFileContent("");
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeModal();
  };

  // ---------------- SNMP Data ----------------
  const fetchSNMP = async () => {
    if (!switchData.snmp?.enabled) {
      setSnmpData({ status: "SNMP Disabled", uptimeSeconds: null, hostname: "-", model: "-" });
      return;
    }
    setLoadingUptime(true);
    try {
      const res = await fetch(`/api/snmp/${switchData.name}`, { credentials: "include" });
      const data = await res.json();
      setSnmpData({
        uptimeSeconds: data.uptimeSeconds,
        hostname: data.hostname || "-",
        model: data.model || "-",
        status: data.status || "offline",
      });
    } catch (err) {
      console.error("Error fetching SNMP data:", err);
      setSnmpData({ uptimeSeconds: null, hostname: "-", model: "-", status: "offline" });
    } finally {
      setLoadingUptime(false);
    }
  };

  // ---------------- Effects ----------------
  useEffect(() => {
    fetchBackups();
    fetchSNMP();
    const interval = setInterval(fetchSNMP, 3000); // refresh every 60s
    return () => clearInterval(interval);
  }, [name]);

  // ---------------- Render ----------------
  return (
    <div className="flex-1 rounded-xl p-6 h-screen bg-[#1A1A1F] overflow-auto">
      {/* Switch Info */}
      <div className="rounded-xl mb-4 p-6 bg-[#1E1E23] flex justify-between items-stretch">
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-2xl mb-2">{name}</p>
            <p className="text-xl">IP: {ip}</p>
            <p className="text-xl">Status: {snmpData.status}</p>
            <p className="text-xl">
              Uptime:{" "}
              {snmpData.uptimeSeconds !== null
                ? formatUptime(snmpData.uptimeSeconds)
                : loadingUptime
                ? "-"
                : "-"}
            </p>
            <p className="text-xl">Model: {snmpData.model}</p>
            <p className="text-xl">Hostname: {snmpData.hostname}</p>
          </div>
          {/* Only show Last checked if SNMP is enabled */}
            {switchData.snmp?.enabled && (
            <p className="text-sm text-gray-400">
              Last checked: {snmpData.uptimeSeconds !== null ? "just now" : "-"}
            </p>
              )}
        </div>

        <div className="h-full">
          <img
            src={image || "/images/cisco_switch.jpg"}
            className="rounded-xl object-cover h-full max-h-48"
            alt={name}
          />
        </div>
      </div>

      {/* Backup Status */}
      <div className="rounded-xl p-6 bg-[#1E1E23] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <p className="text-2xl">Saved Backups</p>
          <button
            className={`px-4 py-2 rounded ${
              loadingBackups
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#414562] hover:bg-[#545C80] rounded-xl text-center transition-colors duration-200 cursor-pointer transform"
            } text-white`}
            onClick={fetchMissingBackups}
            disabled={loadingBackups}
          >
            {loadingBackups ? "Fetching..." : `Fetch Missing for ${name}`}
          </button>
        </div>

        {backups.length === 0 ? (
          <p className="text-gray-400">No backups available.</p>
        ) : (
          <ul className="space-y-2">
            {backups.map((backup) => (
              <li
                key={backup.name}
                className="flex flex-col p-2 rounded-xl bg-[#1E1E23]"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">{backup.name}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => viewFile(backup.name)}
                      className="px-2 py-1 bg-[#414562] hover:bg-[#545C80] rounded-xl text-white cursor-pointer transform transition-colors duration-200"
                    >
                      View
                    </button>
                    <a
                      href={`/downloads/${name}/${backup.name}`}
                      className="px-2 py-1 bg-[#414562] hover:bg-[#545C80] rounded-xl text-white text-center cursor-pointer transform transition-colors duration-200"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                    {isAdmin && (
                    <button
                      onClick={() => deleteBackup(backup.name)}
                      className={`px-2 py-1 bg-[#414562] hover:bg-[#545C80] rounded-xl text-white cursor-pointer transform transition-colors duration-200 ${
                        deletingFile === backup.name ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={deletingFile === backup.name}
                    >
                      {deletingFile === backup.name ? "Deleting..." : "Delete"}
                    </button>
                    )}
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  Last change: {backup.lastChange || "-"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300 ${
          modalVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleBackdropClick}
      >
        <div
          className={`bg-[#1A1A1F] p-6 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-auto relative transition-transform duration-300 transform ${
            modalVisible ? "scale-100" : "scale-95"
          }`}
        >
          <button
            onClick={closeModal}
            className="absolute right-6 px-2 py-1 bg-[#414562] hover:bg-[#545C80] transition-colors duration-200 cursor-pointer rounded-xl text-white"
          >
            Close
          </button>
          {viewingFile && (
            <>
              <h2 className="text-xl mb-4">{viewingFile}</h2>
              {fileContent.startsWith("http") &&
              fileContent.match(/\.(png|jpg|jpeg|gif)$/i) ? (
                <img src={fileContent} alt={viewingFile} className="max-w-full max-h-[70vh]" />
              ) : (
                <pre className="bg-[#1E1E23] p-4 rounded-xl text-sm overflow-auto">{fileContent}</pre>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
