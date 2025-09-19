"use client";

import { useState, useEffect } from "react";

export default function SwitchesSection({ switchData }) {
  const { name, ip, image } = switchData;
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingFile, setDeletingFile] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const fetchBackups = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/backups");
      const data = await res.json();
      setBackups(data[name] || []);
    } catch (err) {
      console.error("Error fetching backups:", err);
      setBackups([]);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, [name]);

  const fetchMissingBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/fetch-missing/${name}`);
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Failed to fetch missing backups");
      }
      await fetchBackups();
    } catch (err) {
      console.error("Error fetching missing backups:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (file) => {
    if (!confirm(`Delete "${file}" for switch ${name}?`)) return;
    setDeletingFile(file);
    try {
      const res = await fetch(`http://localhost:4000/api/backups/${name}/${file}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Failed to delete file");
      } else {
        await fetchBackups();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingFile(null);
    }
  };

  const viewFile = async (file) => {
    const fileUrl = `http://localhost:4000/downloads/${name}/${file}`;
    if (file.endsWith(".txt") || file.endsWith(".cfg")) {
      try {
        const res = await fetch(fileUrl);
        const text = await res.text();
        setFileContent(text);
      } catch (err) {
        console.error(err);
        alert("Failed to load file");
        return;
      }
    } else if (file.match(/\.(png|jpg|jpeg|gif)$/i)) {
      setFileContent(fileUrl);
    } else {
      alert("Unsupported file type for preview");
      return;
    }
    setViewingFile(file);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setViewingFile(null);
      setFileContent("");
    }, 300); // match fade-out duration
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeModal();
  };

  return (
    <div className="flex-1 rounded-xl p-6 h-screen bg-[#1A1A1F] overflow-auto">
      {/* Switch Info */}
      <div className="rounded-xl mb-4 p-6 bg-[#1E1E23] flex justify-between items-stretch">
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-2xl mb-2">{name}</p>
            <p className="text-xl">IP: {ip}</p>
            <p className="text-xl">Status: Online</p>
            <p className="text-xl">Uptime: 12 days 16:01:23</p>
            <p className="text-xl">Model: Cisco SG550XG-48T-K9</p>
            <p className="text-xl">IOS Version: 3.06.03</p>
          </div>
          <p className="text-sm text-gray-400">Last checked: just now</p>
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
          <p className="text-2xl">Saved Backup</p>
          <button
            className={`px-4 py-2 rounded ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#414562] hover:bg-[#545C80] rounded-xl text-center transition-colors duration-200 cursor-pointer transform"
            } text-white`}
            onClick={fetchMissingBackups}
            disabled={loading}
          >
            {loading ? "Fetching..." : `Fetch Missing for ${name}`}
          </button>
        </div>

        {backups.length === 0 ? (
          <p className="text-gray-400">No backups available.</p>
        ) : (
          <ul className="space-y-2">
            {backups.map((file) => (
              <li
                key={file}
                className="flex justify-between items-center p-2 rounded-xl bg-[#1E1E23]"
              >
                <span>{file}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => viewFile(file)}
                    className="px-2 py-1 bg-[#414562] hover:bg-[#545C80] rounded-xl text-white cursor-pointer transform transition-colors duration-200"
                  >
                    View
                  </button>
                  <a
                    href={`http://localhost:4000/downloads/${name}/${file}`}
                    className="px-2 py-1 bg-[#414562] hover:bg-[#545C80] rounded-xl text-white text-center cursor-pointer transform transition-colors duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => deleteBackup(file)}
                    className={`px-2 py-1 bg-[#414562] hover:bg-[#545C80] rounded-xl text-white cursor-pointer transform transition-colors duration-200 ${
                      deletingFile === file ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={deletingFile === file}
                  >
                    {deletingFile === file ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal (always mounted for animation) */}
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
              {fileContent.startsWith("http") && fileContent.match(/\.(png|jpg|jpeg|gif)$/i) ? (
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
