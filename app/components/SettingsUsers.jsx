"use client";


  const toastStyles = {
    style: {
      borderRadius: '10px',
      background: '#1A1A1F',
      color: '#fff',
    },
  };

import toast, { Toaster } from 'react-hot-toast';
import { useState, useEffect, useRef, Fragment } from "react";
import { Transition } from "@headlessui/react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({});
  const [showPasswordField, setShowPasswordField] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef(null);

// ---------------- Fetch User ----------------
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

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------------- User Logic ----------------
  const addUser = async () => {
    if (!newUser.username || !newUser.password) return toast.error("Username and Password are required", toastStyles);
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newUser),
      });
      if (!res.ok) {
        const errData = await res.json();
        toast.error(`${data.error || "Unknown error"} - Failed to add user`, toastStyles)
      } else {
        setNewUser({ username: "", password: "", role: "user" });
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (username) => {
    if (!confirm(`Delete user "${username}"?`)) return;
    try {
      const res = await fetch(`/api/users/${username}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json();
        toast.error(`${data.error || "Unknown error"} - Failed to delete user"`, toastStyles)
      } else {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const changePassword = async (username) => {
    const newPassword = passwords[username];
    if (!newPassword) return toast.error("Enter a new password first", toastStyles);
    try {
      const res = await fetch(`/api/users/${username}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        const errData = await res.json();
        toast.error(`${data.error || "Unknown error"} - Failed to change password"`, toastStyles)
      } else {
        toast.success("Password updates", toastStyles);
        setPasswords((prev) => ({ ...prev, [username]: "" }));
        setShowPasswordField((prev) => ({ ...prev, [username]: false }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isAdmin = currentUser?.role === "admin";
  if (!isAdmin) return null;

  // ---------------- Render ----------------
  return (
    <div className="space-y-6">
      <h2 className="text-2xl">User Management</h2>
      <div className="p-4 bg-[#1E1E23] rounded-xl space-y-4">
        <h3 className="text-xl text-white">Manage Users</h3>

        {/* Add User */}
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            placeholder="Username"
            className="p-2 rounded-xl bg-[#1E1E23] text-white flex-1"
          />
          <input
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            placeholder="Password"
            className="p-2 rounded-xl bg-[#1E1E23] text-white flex-1"
          />

          {/* Animated Role Dropdown */}
          <div ref={roleDropdownRef} className="relative flex-1">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="w-full px-2 py-1 text-left rounded-xl bg-[#1A1A1F] text-white cursor-pointer"
            >
              {newUser.role || "Select Role"}
            </button>
            <Transition
              as={Fragment}
              show={roleDropdownOpen}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 -translate-y-2"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 -translate-y-2"
            >
              <ul className="absolute w-full mt-1 bg-[#1E1E23] border border-gray-700 rounded-xl z-10 max-h-60 overflow-auto">
                {["user", "admin"].map((roleOption) => (
                  <li
                    key={roleOption}
                    onClick={() => {
                      setNewUser({ ...newUser, role: roleOption });
                      setRoleDropdownOpen(false);
                    }}
                    className="px-2 py-1 hover:bg-[#414562] cursor-pointer transition-colors"
                  >
                    {roleOption}
                  </li>
                ))}
              </ul>
            </Transition>
          </div>

          <button
            onClick={addUser}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-white ${
              loading ? "bg-gray-500 cursor-not-allowed" : "bg-[#414562] hover:bg-[#545C80] cursor-pointer transform transition-colors duration-200"
            }`}
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>

        {/* Existing Users */}
        <ul className="space-y-2">
          {users.length === 0 && <p className="text-gray-400">No users found.</p>}
          {users.map((user) => (
            <li key={user.username} className="flex flex-col p-2 bg-[#1E1E23] rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">{user.username}</p>
                  <p className="text-sm text-gray-400">Role: {user.role}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => deleteUser(user.username)}
                    className="px-3 py-1 rounded-xl bg-[#414562] hover:bg-[#545C80] cursor-pointer transform transition-colors duration-200 text-white"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() =>
                      setShowPasswordField((prev) => ({
                        ...prev,
                        [user.username]: !prev[user.username],
                      }))
                    }
                    className="px-3 py-1 rounded-xl bg-[#414562] hover:bg-[#545C80] transition-colors duration-200 cursor-pointer transform text-white"
                  >
                    Reset Password
                  </button>
                </div>
              </div>

              {/* Change Password */}
              <div
                className={`flex space-x-2 transition-all duration-300 overflow-hidden ${
                  showPasswordField[user.username] ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <input
                  type="password"
                  placeholder="New Password"
                  value={passwords[user.username] || ""}
                  onChange={(e) =>
                    setPasswords((prev) => ({ ...prev, [user.username]: e.target.value }))
                  }
                  className="p-2 rounded-xl bg-[#1A1A1F] text-white flex-1"
                />
                <button
                  onClick={() => changePassword(user.username)}
                  className="px-4 py-2 rounded-xl text-white bg-[#414562] hover:bg-[#545C80]"
                >
                  Change
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
