"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import SwitchInfo from "./SwitchesSection/SwitchInfo";
import BackupsList from "./SwitchesSection/BackupsList";
import FileModal from "./SwitchesSection/FileModal";
import SSHModal from "./SwitchesSection/SSHModal";

export default function SwitchesSection({ switchData }) {
  const { name, ip } = switchData;

  // ---------------- State ----------------
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [deletingFile, setDeletingFile] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [fileModalVisible, setFileModalVisible] = useState(false);
  const [sshModalVisible, setSshModalVisible] = useState(false);
  const [sshTutorial, setSshTutorial] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [tftpServer, setTftpServer] = useState("");
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

  // ---------------- Fetch TFTP Server ----------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/tftp", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch TFTP config");
        const data = await res.json();
        setTftpServer(data.config?.tftpServer || "");
      } catch (err) {
        console.error(err);
        toast.error(`${err.message} - Failed to fetch TFTP config`, {
          style: { borderRadius: "10px", background: "#1A1A1F", color: "#fff" },
        });
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

  // ---------------- Fetch Backups ----------------
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
        toast.error(`${errData.error || "Unknown error"} - Failed to fetch missing backups`, {
          style: { borderRadius: "10px", background: "#1A1A1F", color: "#fff" },
        });
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
      const text = await res.text();
      setFileContent(text);
      setViewingFile(fileName);
      setFileModalVisible(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load file", {
        style: { borderRadius: "10px", background: "#1A1A1F", color: "#fff" },
      });
    }
  };

  // ---------------- Fetch SNMP ----------------
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
      console.error(err);
      setSnmpData({ uptimeSeconds: null, hostname: "-", model: "-", status: "offline" });
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

  // ---------------- SSH Modal ----------------
  const openSSH = () => {
    setSshTutorial(null);
    setSshModalVisible(true);
  };

  const openTutorialSSH = () => {
    if (!tftpServer) {
      toast.error("Please configure the TFTP server before setting up backups", {
        style: { borderRadius: "10px", background: "#1A1A1F", color: "#fff" },
      });
      return;
    }

    setSshTutorial([
      {
        title: "Step 1: Enter configuration mode",
        commands: ["conf t"],
      },
      {
        title: "Step 2: Create the kron policy",
        commands: [`kron policy-list TFTP-Config-Backup`, `cli copy startup-config tftp://${tftpServer}/${name}.cfg`, 'exit'],
      },
      {
        title: "Step 2.5: Copy the config manually once",
        commands: [`copy startup-config tftp://${tftpServer}/${name}.cfg`],
      },
      {
        title: "Step 3: Create the kron job",
        commands: ["kron occurrence TFTP-Config-Backup at 2:00 recurring", "policy-list TFTP-Config-Backup", "exit"],
      },
      {
        title: "Step 4: Optionally show the schedule",
        commands: ["do show kron schedule"],
      },
      {
        title: "Step 5: Copy the running config to startup-config",
        commands: ["wr"],
      },
      {
        title: `Step 6: Add ${name}.cfg to the fetch field in Switch settings`,
      },
      {
        title: "Step 7: Press 'Fetch missing' to fetch the config",
      },
    ]);

    setSshModalVisible(true);
  };

  // ---------------- Restore Backup ----------------
  const openRestoreTutorial = (backupName) => {
    if (!tftpServer) {
      toast.error("Please configure the TFTP server before restoring backups", {
        style: { borderRadius: "10px", background: "#1A1A1F", color: "#fff" },
      });
      return;
    }

    setSshTutorial([
      {
        title: "Step 1: Enter configuration mode",
        commands: ["conf t"],
      },
      {
        title: "Step 2: Copy the backup from TFTP",
        commands: [`copy tftp://${tftpServer}/${backupName} startup-config`],
      },
      {
        title: "Step 3: Confirm the config",
        commands: ["show running-config"],
      },
      {
        title: "Step 4: Save the config",
        commands: ["wr"],
      },
    ]);

    setSshModalVisible(true);
  };

  // ---------------- Render ----------------
  return (
    <div className="flex-1 rounded-xl p-6 h-screen bg-[#1A1A1F] overflow-auto">
      <SwitchInfo
        switchData={switchData}
        snmpData={snmpData}
        loadingUptime={loadingUptime}
        onOpenSSH={openSSH}
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
        onSetupBackups={openTutorialSSH}
        onRestoreBackup={openRestoreTutorial} 
      />

      <FileModal
        visible={fileModalVisible}
        onClose={() => setFileModalVisible(false)}
        viewingFile={viewingFile}
        fileContent={fileContent}
        handleBackdropClick={(e) => e.target === e.currentTarget && setFileModalVisible(false)}
      />

      <SSHModal
        visible={sshModalVisible}
        onClose={() => setSshModalVisible(false)}
        ip={ip}
        tutorialSteps={sshTutorial}
      />
    </div>
  );
}
