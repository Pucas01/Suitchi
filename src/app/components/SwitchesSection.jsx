"use client";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import SwitchInfo from "./SwitchesSection/SwitchInfo";
import BackupsList from "./SwitchesSection/BackupsList";
import FileModal from "./SwitchesSection/FileModal";
import SSHModal from "./SwitchesSection/SSHModal";

export default function SwitchesSection({ switchData }) {
  const { name, ip } = switchData;

  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [deletingFile, setDeletingFile] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [sshModalVisible, setSshModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [snmpData, setSnmpData] = useState({
    uptimeSeconds: null,
    hostname: "-",
    model: "-",
    status: switchData.snmp?.enabled ? "unknown" : "disabled",
  });
  const [loadingUptime, setLoadingUptime] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  // ---------------- Fetch Current User ----------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/users/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // ---------------- Helpers ----------------
  const formatUptime = (seconds) => {
    if (seconds === null) return "-";
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

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
      const res = await fetch(`/api/tftp/fetch-missing/${name}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json();
        toast.error(
          `${errData.error || "Unknown error"} - Failed to fetch missing backups`,
          {
            style: { borderRadius: "10px", background: "#1A1A1F", color: "#fff" },
          }
        );
      }
      await fetchBackups();
    } catch (err) {
      console.error(err);
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
        toast.error(errData.error || "Failed to delete file", {
          style: { borderRadius: "10px", background: "#1A1A1F", color: "#fff" },
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
      const res = await fetch(fileUrl, { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

      if (fileName.endsWith(".txt") || fileName.endsWith(".cfg")) {
        const text = await res.text();
        setFileContent(text);
      } else {
        toast.error("Unsupported file type for preview", {
          style: { borderRadius: "10px", background: "#1A1A1F", color: "#fff" },
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

  const fetchSNMP = async () => {
    if (!switchData.snmp?.enabled) {
      setSnmpData({
        status: "SNMP Disabled",
        uptimeSeconds: null,
        hostname: "-",
        model: "-",
      });
      return;
    }
    setLoadingUptime(true);
    try {
      const res = await fetch(`/api/snmp/${switchData.name}`, {
        credentials: "include",
      });
      const data = await res.json();
      setSnmpData({
        uptimeSeconds: data.uptimeSeconds,
        hostname: data.hostname || "-",
        model: data.model || "-",
        status: data.status || "offline",
      });
    } catch (err) {
      console.error(err);
      setSnmpData({
        uptimeSeconds: null,
        hostname: "-",
        model: "-",
        status: "offline",
      });
    } finally {
      setLoadingUptime(false);
    }
  };

  useEffect(() => {
    fetchBackups();
    fetchSNMP();
    const interval = setInterval(fetchSNMP, 3000);
    return () => clearInterval(interval);
  }, [name]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) setModalVisible(false);
  };

  // ---------------- Render ----------------
  return (
    <div className="flex-1 rounded-xl p-6 h-screen bg-[#1A1A1F] overflow-auto">
      <SwitchInfo
        switchData={switchData}
        snmpData={snmpData}
        loadingUptime={loadingUptime}
        onOpenSSH={() => setSshModalVisible(true)}
        formatUptime={formatUptime}
      />
      <BackupsList
        backups={backups}
        fetchMissingBackups={fetchMissingBackups}
        deleteBackup={deleteBackup}
        loadingBackups={loadingBackups}
        deletingFile={deletingFile}
        viewFile={viewFile}
        isAdmin={isAdmin}
        switchName={name}
      />
      <FileModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        viewingFile={viewingFile}
        fileContent={fileContent}
        handleBackdropClick={handleBackdropClick}
      />
      <SSHModal
        visible={sshModalVisible}
        onClose={() => setSshModalVisible(false)}
        ip={ip}
      />
    </div>
  );
}
