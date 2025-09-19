"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { Transition } from "@headlessui/react";

export default function ACLviewer() {
  const [switches, setSwitches] = useState([]);
  const [switchName, setSwitchName] = useState("");
  const [files, setFiles] = useState([]);
  const [fileName, setFileName] = useState("");
  const [aclRules, setAclRules] = useState([]);
  const [showTable, setShowTable] = useState(false);

  const [switchDropdownOpen, setSwitchDropdownOpen] = useState(false);
  const [fileDropdownOpen, setFileDropdownOpen] = useState(false);

  const switchDropdownRef = useRef(null);
  const fileDropdownRef = useRef(null);

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
    setShowTable(false);
  }, [switchName, switches]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (switchDropdownRef.current && !switchDropdownRef.current.contains(event.target)) {
        setSwitchDropdownOpen(false);
      }
      if (fileDropdownRef.current && !fileDropdownRef.current.contains(event.target)) {
        setFileDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchACLs = async () => {
    if (!switchName || !fileName) return;
    try {
      const res = await fetch(`http://localhost:4000/api/acl/${switchName}/${fileName}`);
      const data = await res.json();
      setAclRules(Array.isArray(data) ? data : []);
      setShowTable(false);
      setTimeout(() => setShowTable(true), 50);
    } catch (err) {
      console.error(err);
      setAclRules([]);
      setShowTable(false);
    }
  };

  const clearDB = async () => {
    try {
      await fetch("http://localhost:4000/api/acl", { method: "DELETE" });
      setAclRules([]);
      setShowTable(false);
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
      <div className="rounded-xl p-6 bg-[#1E1E23] text-white">
        <h2 className="text-2xl mb-4">ACL Viewer</h2>

        <div className="flex space-x-2 mb-4 relative">
          {/* Switch Dropdown */}
          <div ref={switchDropdownRef} className="relative flex-1">
            <button
              onClick={() => setSwitchDropdownOpen(!switchDropdownOpen)}
              className="w-full px-2 py-1 text-left rounded-xl bg-[#1E1E23] text-white cursor-pointer"
            >
              {switchName || "Select Switch"}
            </button>
            <Transition
              as={Fragment}
              show={switchDropdownOpen}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 -translate-y-2"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 -translate-y-2"
            >
              <ul className="absolute w-full mt-1 bg-[#1E1E23] border border-gray-700 rounded-xl z-10 max-h-60 overflow-auto">
                {switches.map(sw => (
                  <li
                    key={sw.name}
                    onClick={() => { setSwitchName(sw.name); setSwitchDropdownOpen(false); }}
                    className="px-2 py-1 hover:bg-[#414562] cursor-pointer transition-colors"
                  >
                    {sw.name}
                  </li>
                ))}
              </ul>
            </Transition>
          </div>

          {/* File Dropdown */}
          <div ref={fileDropdownRef} className="relative flex-1">
            <button
              onClick={() => setFileDropdownOpen(!fileDropdownOpen)}
              className="w-full px-2 py-1 text-left rounded-xl bg-[#1E1E23] text-white cursor-pointer"
            >
              {fileName || "Select File"}
            </button>
            <Transition
              as={Fragment}
              show={fileDropdownOpen}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 -translate-y-2"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 -translate-y-2"
            >
              <ul className="absolute w-full mt-1 bg-[#1E1E23] border border-gray-700 rounded-xl z-10 max-h-60 overflow-auto">
                {files.map(f => (
                  <li
                    key={f}
                    onClick={() => { setFileName(f); setFileDropdownOpen(false); }}
                    className="px-2 py-1 hover:bg-[#414562] cursor-pointer transition-colors"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </Transition>
          </div>

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

        {/* ACL Table with fade-in */}
        {aclRules.length > 0 ? (
          <div
            className={`overflow-auto max-h-[70vh] rounded-xl bg-[#1E1E23] p-4 transition-opacity duration-500 ${
              showTable ? "opacity-100" : "opacity-0"
            }`}
          >
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
  );
}
