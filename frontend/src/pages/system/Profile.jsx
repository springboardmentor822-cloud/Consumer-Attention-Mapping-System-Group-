import { useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { User, Shield, Key, CheckCircle2, Lock, Mail, BadgeCheck, Store } from "lucide-react";
import api from "../../api/client";

export default function Profile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "Admin User");
  const [email, setEmail] = useState(user?.email || "admin@cams.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      await api.put("/auth/profile", {
        full_name: fullName,
        email: email,
      });
      setMsg("Profile details updated successfully in database!");
      setTimeout(() => setMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update profile.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      await api.put("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setMsg("Password changed successfully in backend database!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || "Password change failed. Check your current password.");
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "administrator":
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">Super Administrator</span>;
      case "store_manager":
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Store Manager</span>;
      case "retail_analyst":
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40">Retail Analyst</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">Marketing Manager</span>;
    }
  };

  return (
    <Layout title="User Profile & Security Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              User Profile & Security Control
            </h1>
            <p className="text-xs text-slate-400 mt-1">Manage user account details, role permissions, authentication credentials, and password security.</p>
          </div>
          {msg && (
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-3.5 py-1.5 rounded-xl font-bold">
              <CheckCircle2 className="w-4 h-4" /> {msg}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs px-3.5 py-1.5 rounded-xl font-bold">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile Summary Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-col items-center text-center pb-6 border-b border-slate-800">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-xl mb-4 border-2 border-indigo-400/40">
                  {fullName.slice(0, 2).toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{fullName}</h3>
                <p className="text-xs text-slate-400 mb-3">{email}</p>
                {getRoleBadge(user?.role || "administrator")}
              </div>

              <div className="pt-6 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Assigned Access Permissions</h4>
                {[
                  "Full Store & Camera Management",
                  "YOLOv8 & ByteTrack AI Analytics Access",
                  "Executive Daily, Weekly, Monthly Reports",
                  "CSV, Excel & PDF Audit Logs Export",
                  "RTSP Camera Video Stream Processing"
                ].map((perm, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                    <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{perm}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
              <Store className="w-4 h-4 text-indigo-400" />
              <span>Assigned Store: <strong>Demo Store (HQ Store 01)</strong></span>
            </div>
          </div>

          {/* Forms Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information Form */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Shield className="w-4 h-4 text-indigo-400" />
                Account Personal Information
              </h2>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Update Profile Details
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Key className="w-4 h-4 text-purple-400" />
                Change Password & Authentication Security
              </h2>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Current Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow-md cursor-pointer"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
