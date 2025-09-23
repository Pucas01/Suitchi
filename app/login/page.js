"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ---------------- Login Logic ----------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      setLoading(false);
      router.push("/"); // redirect to main page
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
      setLoading(false);
    }
  };
// ---------------- Render ----------------
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1A1A1F]">
      <div className="bg-[#1E1E23] p-8 rounded-xl shadow-xl w-96">
        <h1 className="text-5xl font-bold text-white mb-6 flex justify-center">Suitchi</h1>
        <h1 className="text-2xl font-bold text-white mb-6">Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-[#2A2A36] text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-[#2A2A36] text-white outline-none"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-xl bg-[#414562] hover:bg-[#545C80] text-white disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}
