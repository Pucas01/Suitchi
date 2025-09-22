"use client";

export default function SwitchInfo({
  switchData,
  snmpData,
  loadingUptime,
  onOpenSSH,
  formatUptime,
}) {
  const { name, ip, image } = switchData;

  return (
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
        {switchData.snmp?.enabled && (
          <p className="text-sm text-gray-400">
            Last checked: {snmpData.uptimeSeconds !== null ? "just now" : "-"}
          </p>
        )}
        <button
          onClick={onOpenSSH}
          className="mt-4 px-4 py-2 bg-[#414562] hover:bg-[#545C80] rounded-xl text-white cursor-pointer transition-colors duration-200"
        >
          Open SSH
        </button>
      </div>

      <div className="h-full">
        <img
          src={image || "/images/cisco_switch.jpg"}
          className="rounded-xl object-cover h-full max-h-48"
          alt={name}
        />
      </div>
    </div>
  );
}
