import React, { useState } from "react";

export default function AuthPage({ onLogin }) {
  const [email, setEmail] = useState("marketing@gmail.com");
  const [password, setPassword] = useState("12345678");
  const [error, setError] = useState("");

  const validUsers = {
    "muhsina@gmail.com": "Administrator",
    "retail@gmail.com": "Retail Analyst",
    "store@gmail.com": "Store Manager",
    "marketing@gmail.com": "Marketing Manager"
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== "12345678") {
      setError("Invalid password. Use: 12345678");
      return;
    }

    const assignedRole = validUsers[email.toLowerCase().trim()];
    if (!assignedRole) {
      setError("Unknown email. Use valid portal email.");
      return;
    }

    setError("");
    onLogin(assignedRole, email);
  };

  return (
    <div className="min-h-screen w-full bg-[#060A14] text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[420px] bg-[#0B1329] border border-[#1E293B] rounded-2xl p-8 shadow-2xl flex flex-col items-center">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-extrabold text-xl mb-4">
          C
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-white mb-1">CAMS Enterprise Login</h1>
        <p className="text-xs text-slate-400 mb-6">Consumer Attention Management System</p>

        {error && (
          <div className="w-full mb-4 p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#273449] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#273449] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-extrabold rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-95"
          >
            Sign In to Portal
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#1E293B] w-full text-[10px] text-slate-400 space-y-1">
          <p className="font-bold text-slate-300">Default Accounts (Pass: 12345678):</p>
          <p>• Admin: <span className="text-amber-400 font-mono">muhsina@gmail.com</span></p>
          <p>• Store Manager: <span className="text-emerald-400 font-mono">store@gmail.com</span></p>
          <p>• Retail Analyst: <span className="text-purple-400 font-mono">retail@gmail.com</span></p>
          <p>• Marketing Manager: <span className="text-blue-400 font-mono">marketing@gmail.com</span></p>
        </div>
      </div>
    </div>
  );
}
