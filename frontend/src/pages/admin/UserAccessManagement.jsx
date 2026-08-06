import React, { useState } from "react";
import { useCams } from "../../services/CamsContext";

export default function UserAccessManagement() {
  const { users, addUser, editUser, toggleUserStatus, deleteUser, rolePermissions, saveRolePermissions } = useCams();

  const [activeTab, setActiveTab] = useState("users"); // 'users' | 'roles' | 'permissions'
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Local Modal States
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // New User Form State
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Store Manager" });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    addUser(newUser);
    setIsAddUserOpen(false);
    setNewUser({ name: "", email: "", role: "Store Manager" });
    showToast(`Created account for ${newUser.name}`);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingUser) return;
    editUser(editingUser);
    setEditingUser(null);
    showToast(`Updated account for ${editingUser.name}`);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-900 border border-indigo-500 text-indigo-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <span>🛡️</span> {toastMessage}
        </div>
      )}

      {/* HEADER WITH TITLE ONLY */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
        <h1 className="text-xl font-black text-white tracking-wide">User & Access Management</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${activeTab === "users" ? "bg-indigo-600 text-white" : "bg-[#0A1020] text-slate-400 border border-[#1E293B]"}`}
          >
            User Accounts ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${activeTab === "roles" ? "bg-indigo-600 text-white" : "bg-[#0A1020] text-slate-400 border border-[#1E293B]"}`}
          >
            Role Permissions
          </button>
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            + Add User
          </button>
        </div>
      </div>

      {activeTab === "users" && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <input
              type="text"
              placeholder="Search user name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0A1020] border border-[#273449] text-white px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-indigo-500 w-full sm:w-64"
            />
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-medium">Role Filter:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#0A1020] border border-[#273449] text-slate-300 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Roles</option>
                <option value="Administrator">Administrator</option>
                <option value="Store Manager">Store Manager</option>
                <option value="Retail Analyst">Retail Analyst</option>
                <option value="Marketing Manager">Marketing Manager</option>
              </select>
            </div>
          </div>

          {/* USER ACCOUNTS TABLE */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden font-mono text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#0A1020] border-b border-[#1E293B] text-slate-400 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Security Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#1E293B]/40 transition">
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center text-[10px]">
                        {u.name.charAt(0)}
                      </span>
                      {u.name}
                    </td>
                    <td className="p-3.5 text-slate-300">{u.email}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${u.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className="px-2.5 py-1 bg-[#1E293B] hover:bg-[#273449] text-slate-300 rounded-lg text-[10px] font-bold border border-[#334155]"
                      >
                        {u.status === "Active" ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => setEditingUser(u)}
                        className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg text-[10px] font-bold border border-indigo-500/30"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete user account for ${u.name}?`)) {
                            deleteUser(u.id);
                            showToast(`Deleted ${u.name}`);
                          }
                        }}
                        className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 rounded-lg text-[10px] font-bold border border-rose-500/30"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "roles" && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Role Permissions Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(rolePermissions).map((r) => (
              <div key={r} className="bg-[#0A1020] border border-[#1E293B] rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-indigo-400 text-xs">{r}</h4>
                <div className="space-y-2 text-[11px]">
                  {Object.keys(rolePermissions[r]).map((perm) => (
                    <label key={perm} className="flex items-center justify-between text-slate-300 cursor-pointer">
                      <span className="capitalize">{perm.replace(/([A-Z])/g, " $1")}</span>
                      <input
                        type="checkbox"
                        checked={rolePermissions[r][perm]}
                        onChange={(e) => {
                          saveRolePermissions(r, { [perm]: e.target.checked });
                          showToast(`Updated permissions for ${r}`);
                        }}
                        className="w-4 h-4 rounded bg-[#0F172A] border-[#334155] text-indigo-600"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 w-full max-w-md space-y-4 font-sans text-xs">
            <h3 className="text-base font-bold text-white">Add New Platform User</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3 font-mono">
              <div>
                <label className="text-slate-400 text-[10px] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-[#0A1020] border border-[#273449] text-white p-2 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px] block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-[#0A1020] border border-[#273449] text-white p-2 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px] block mb-1">Security Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-[#0A1020] border border-[#273449] text-white p-2 rounded-xl text-xs"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Store Manager">Store Manager</option>
                  <option value="Retail Analyst">Retail Analyst</option>
                  <option value="Marketing Manager">Marketing Manager</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 w-full max-w-md space-y-4 font-sans text-xs">
            <h3 className="text-base font-bold text-white">Edit User Account</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3 font-mono">
              <div>
                <label className="text-slate-400 text-[10px] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full bg-[#0A1020] border border-[#273449] text-white p-2 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px] block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full bg-[#0A1020] border border-[#273449] text-white p-2 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px] block mb-1">Security Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full bg-[#0A1020] border border-[#273449] text-white p-2 rounded-xl text-xs"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Store Manager">Store Manager</option>
                  <option value="Retail Analyst">Retail Analyst</option>
                  <option value="Marketing Manager">Marketing Manager</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
