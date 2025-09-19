"use client";
import { useState, useEffect } from "react";

export default function ACLviewer() {
  const [switches, setSwitches] = useState([]);
  const [switchName, setSwitchName] = useState("");
  const [files, setFiles] = useState([]);
  const [fileName, setFileName] = useState("");
  const [aclRules, setAclRules] = useState([]);

  // Load switches on mount
  useEffect(() => {
    fetch("http://localhost:4000/api/switches")
      .then(res => res.json())
      .then(data => setSwitches(data))
      .catch(console.error);
  }, []);

  // Update files when switch changes
  useEffect(() => {
    const sw = switches.find(s => s.name === switchName);
    if (sw) setFiles(sw.files || []);
    else setFiles([]);
    setFileName("");
    setAclRules([]);
  }, [switchName, switches]);

  const fetchACLs = async () => {
    if (!switchName || !fileName) return;
    try {
      const res = await fetch(`http://localhost:4000/api/acl/${switchName}/${fileName}`);
      const data = await res.json();
      // ensure array
      setAclRules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setAclRules([]);
    }
  };

  const clearDB = async () => {
    try {
      await fetch("http://localhost:4000/api/acl", { method: "DELETE" });
      setAclRules([]);
      alert("Database cleared!");
    } catch (err) {
      console.error(err);
    }
  };

  // Group ACLs safely
  const groupedACLs = aclRules?.reduce((acc, rule) => {
    if (!rule.acl_name) rule.acl_name = "Unnamed ACL";
    if (!acc[rule.acl_name]) acc[rule.acl_name] = [];
    acc[rule.acl_name].push(rule);
    return acc;
  }, {}) || {};

  return (
    <div className="p-6 bg-[#1A1A1F] rounded-xl h-screen space-y-6">
    <div className="rounded-xl p-6 bg-[#1E1E23] text-white max-w-7xl mx-auto">
      <h2 className="text-2xl mb-4">ACL Viewer</h2>

      <div className="flex space-x-2 mb-4">
        <select
          value={switchName}
          onChange={e => setSwitchName(e.target.value)}
          className="px-2 py-1 rounded-xl bg-[#1E1E23] text-white flex-1"
        >
          <option value="">Select Switch</option>
          {switches.map(sw => <option key={sw.name} value={sw.name}>{sw.name}</option>)}
        </select>

        <select
          value={fileName}
          onChange={e => setFileName(e.target.value)}
          className="px-2 py-1 rounded-xl bg-[#1E1E23] text-white flex-1"
        >
          <option value="">Select File</option>
          {files.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <button
          onClick={fetchACLs}
          className="px-4 py-2 bg-[#414562] hover:bg-[#545C80] rounded-xl cursor-pointer transition-colors"
        >
          View ACL
        </button>

        <button
          onClick={clearDB}
          className="px-4 py-2 bg-[#414562] hover:bg-[#545C80] rounded-xl cursor-pointer transition-colors"
        >
          Clear DB
        </button>
      </div>

      {aclRules.length > 0 ? (
        <div className="overflow-auto max-h-[70vh] rounded-xl bg-[#1E1E23] p-4">
          {Object.entries(groupedACLs).map(([aclName, rules], groupIdx) => (
            <div key={groupIdx} className="mb-6">
              <h3 className="text-lg font-semibold mb-2 border-b border-gray-600 pb-1">{aclName}</h3>
              <table className="w-full text-left text-white border-collapse">
                <thead>
                  <tr>
                    <th className="border-b p-2">#</th>
                    <th className="border-b p-2">Action</th>
                    <th className="border-b p-2">Protocol</th>
                    <th className="border-b p-2">Src Host</th>
                    <th className="border-b p-2">Src Wildcard</th>
                    <th className="border-b p-2">Src eq/Port</th>
                    <th className="border-b p-2">Dst Host</th>
                    <th className="border-b p-2">Dst Wildcard</th>
                    <th className="border-b p-2">Dst eq/Port</th>
                    <th className="border-b p-2">Established</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, idx) => (
                    <tr key={idx} className="hover:bg-[#2A2A36]">
                      <td className="border-b p-2">{rule.line_number}</td>
                      <td className="border-b p-2">{rule.action || "-"}</td>
                      <td className="border-b p-2">{rule.protocol || "-"}</td>
                      <td className="border-b p-2">{rule.src_host || "-"}</td>
                      <td className="border-b p-2">{rule.src_wildcard || "-"}</td>
                      <td className="border-b p-2">{rule.src_port || "-"}</td>
                      <td className="border-b p-2">{rule.dst_host || "-"}</td>
                      <td className="border-b p-2">{rule.dst_wildcard || "-"}</td>
                      <td className="border-b p-2">{rule.dst_port || "-"}</td>
                      <td className="border-b p-2">{rule.established ? "Yes" : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 mt-4">Select a switch and file to view ACL rules.</p>
      )}
    </div>
  </div>
  )
  ;
}
