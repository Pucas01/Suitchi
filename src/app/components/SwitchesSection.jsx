import { useEffect, useState } from "react";

export default function SwitchesSection({ switchName }) {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch backups for this switch
  const fetchBackups = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/backups");
      const data = await res.json();
      setBackups(data[switchName] || []); // ← select only this switch's backups
    } catch (err) {
      console.error("Error fetching backups:", err);
      setBackups([]);
    }
  };

  // Fetch missing backups
  const fetchMissingBackups = async () => {
    setLoading(true);
    try {
      await fetch("http://localhost:4000/api/fetch-missing");
      await fetchBackups(); // refresh after fetching
    } catch (err) {
      console.error("Error fetching missing backups:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBackups();
  }, [switchName]); // refetch if switchName changes

  return (
    <div className="flex-1 rounded-xl p-6 h-screen bg-[#1A1A1F]">
      {/* Switch information */}
      <div className="rounded-xl mb-4 p-6 bg-[#1E1E23] flex justify-between items-stretch">
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-2xl mb-2">{switchName}</p>
            <p className="text-xl">Status: Online</p>
            <p className="text-xl">Uptime: 12 days 16:01:23</p>
            <p className="text-xl">Model: Cisco SG550XG-48T-K9</p>
            <p className="text-xl">IOS Version: 3.06.03</p>
          </div>
          <p className="text-sm text-gray-400">Last checked: just now</p>
        </div>

        <div className="h-full">
          <img
            src="/images/cisco_switch.jpg"
            className="rounded-xl object-cover h-full max-h-48"
          />
        </div>
      </div>

      {/* Backup status */}
      <div className="rounded-xl p-6 bg-[#1E1E23] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <p className="text-2xl">Backup Status</p>
          <button
            className={`px-4 py-2 rounded ${
              loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
            onClick={fetchMissingBackups}
            disabled={loading}
          >
            {loading ? "Fetching..." : "Fetch Missing Backups"}
          </button>
        </div>

        {backups.length === 0 ? (
          <p className="text-gray-400">No backups available.</p>
        ) : (
          <ul className="space-y-2">
            {backups.map((file) => (
              <li
                key={file}
                className="flex justify-between items-center bg-[#2A2A30] p-2 rounded"
              >
                <span>{file}</span>
                <a
                  href={`http://localhost:4000/downloads/${switchName}/${file}`}
                  className="text-blue-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
