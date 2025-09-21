"use client";

export default function BackupsList({
  backups,
  fetchMissingBackups,
  deleteBackup,
  loadingBackups,
  deletingFile,
  viewFile,
  isAdmin,
  switchName,
  onSetupBackups, // Callback to open SSH modal
}) {
  const hasBackups = backups.length > 0;

  return (
    <div className="rounded-xl p-6 bg-[#1E1E23] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-2xl font-semibold">Saved Backups</p>
        <button
          onClick={fetchMissingBackups}
          disabled={loadingBackups}
          className={`px-4 py-2 rounded-xl text-white transition-colors duration-200 ${
            loadingBackups
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-[#414562] hover:bg-[#545C80] cursor-pointer"
          }`}
        >
          {loadingBackups ? "Fetching..." : `Fetch Missing for ${switchName}`}
        </button>
      </div>

      {/* No backups */}
      {!hasBackups && (
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <p className="text-gray-400">No backups available.</p>
          <button
            onClick={() => onSetupBackups?.(switchName)}
            className="px-4 py-2 bg-[#414562] hover:bg-[#545C80] text-white rounded-xl cursor-pointer transition-colors duration-200"
          >
            Setup Backups
          </button>
        </div>
      )}

      {/* Backup list */}
      {hasBackups && (
        <ul className="space-y-2">
          {backups.map((backup) => (
            <li key={backup.name} className="flex flex-col p-2 rounded-xl bg-[#1E1E23]">
              <div className="flex justify-between items-center w-full">
                <span className="font-medium">{backup.name}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => viewFile(backup.name)}
                    className="px-2 py-1 bg-[#414562] hover:bg-[#545C80] rounded-xl text-white cursor-pointer transition-colors duration-200"
                  >
                    View
                  </button>
                  <a
                    href={`/downloads/${switchName}/${backup.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-[#414562] hover:bg-[#545C80] rounded-xl text-white text-center cursor-pointer transition-colors duration-200"
                  >
                    Download
                  </a>
                  {isAdmin && (
                    <button
                      onClick={() => deleteBackup(backup.name)}
                      disabled={deletingFile === backup.name}
                      className={`px-2 py-1 bg-[#414562] hover:bg-[#545C80] rounded-xl text-white cursor-pointer transition-colors duration-200 ${
                        deletingFile === backup.name ? "opacity-50 cursor-not-allowed" : ""
                      }`}
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
  );
}
