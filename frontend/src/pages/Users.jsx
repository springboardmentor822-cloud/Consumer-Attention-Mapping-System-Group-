import { useEffect, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { isAdmin, ROLE_LABELS, ROLES } from "../utils/roles";
import { 
  Users as UsersIcon, 
  UserCheck, 
  Search, 
  Plus, 
  Shield, 
  Briefcase, 
  BarChart2, 
  CheckCircle2, 
  X, 
  Lock, 
  Mail, 
  User 
} from "lucide-react";

export default function Users() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form state
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState(ROLES.RETAIL_ANALYST);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Determine active category from path
  const getCategoryFromPath = (path) => {
    if (path.includes("managers")) return "managers";
    if (path.includes("analysts")) return "analysts";
    if (path.includes("security")) return "security";
    return "all";
  };

  const [activeCategory, setActiveCategory] = useState(getCategoryFromPath(location.pathname));

  useEffect(() => {
    setActiveCategory(getCategoryFromPath(location.pathname));
  }, [location.pathname]);

  const authorized = !loading && user && (isAdmin(user.role) || user.role === ROLES.STORE_MANAGER);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/auth/users");
      setUsers(res.data);
      setFetchError(false);
    } catch (err) {
      console.error("Failed to load users", err);
      setFetchError(true);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!authorized) return;
    loadUsers();
  }, [authorized]);

  const handleTabChange = (catKey, route) => {
    setActiveCategory(catKey);
    navigate(route);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    try {
      await api.post("/auth/register", {
        full_name: newFullName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });

      setModalSuccess("New user account created successfully!");
      setNewFullName("");
      setNewEmail("");
      setNewPassword("");
      await loadUsers();
      setTimeout(() => {
        setModalSuccess("");
        setShowAddModal(false);
      }, 1500);
    } catch (err) {
      setModalError(err.response?.data?.detail || "Could not create user account.");
    }
  };

  // Filter users strictly by active category role
  const categoryFilteredUsers = users.filter((u) => {
    if (activeCategory === "managers") return u.role === ROLES.STORE_MANAGER;
    if (activeCategory === "analysts") return u.role === ROLES.RETAIL_ANALYST;
    if (activeCategory === "security") return u.role === ROLES.ADMINISTRATOR;
    return true; // "all"
  });

  // Apply search query
  const finalFilteredUsers = categoryFilteredUsers.filter((u) => {
    const q = searchTerm.toLowerCase();
    const nameMatch = u.full_name?.toLowerCase().includes(q);
    const emailMatch = u.email?.toLowerCase().includes(q);
    const roleMatch = (ROLE_LABELS[u.role] || u.role)?.toLowerCase().includes(q);
    return nameMatch || emailMatch || roleMatch;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case ROLES.ADMINISTRATOR:
        return <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 w-fit"><Shield className="w-3 h-3" /> Administrator</span>;
      case ROLES.STORE_MANAGER:
        return <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-fit"><Briefcase className="w-3 h-3" /> Store Manager</span>;
      case ROLES.RETAIL_ANALYST:
        return <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1 w-fit"><BarChart2 className="w-3 h-3" /> Retail Analyst</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 w-fit"><UsersIcon className="w-3 h-3" /> Marketing Manager</span>;
    }
  };

  if (!loading && user && !isAdmin(user.role) && user.role !== ROLES.STORE_MANAGER) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) return null;

  const countAll = users.length;
  const countManagers = users.filter((u) => u.role === ROLES.STORE_MANAGER).length;
  const countAnalysts = users.filter((u) => u.role === ROLES.RETAIL_ANALYST).length;
  const countSecurity = users.filter((u) => u.role === ROLES.ADMINISTRATOR).length;

  return (
    <Layout title="User & Role Access Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-indigo-400" />
              {activeCategory === "all" && "All System Users Directory"}
              {activeCategory === "managers" && "Store Managers Directory"}
              {activeCategory === "analysts" && "Retail Analysts Directory"}
              {activeCategory === "security" && "Administrators & Security Officers"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage system access roles, user authentication permissions, and retail store assignments.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New User
          </button>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
          {[
            { key: "all", label: `All Users (${countAll})`, route: "/users", icon: <UsersIcon className="w-4 h-4" /> },
            { key: "managers", label: `Store Managers (${countManagers})`, route: "/managers", icon: <Briefcase className="w-4 h-4" /> },
            { key: "analysts", label: `Retail Analysts (${countAnalysts})`, route: "/analysts", icon: <BarChart2 className="w-4 h-4" /> },
            { key: "security", label: `Security & Admins (${countSecurity})`, route: "/security", icon: <Shield className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key, tab.route)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeCategory === tab.key
                  ? "bg-slate-800/80 text-indigo-400 border-indigo-500 shadow-sm"
                  : "text-slate-400 border-transparent hover:text-white hover:bg-slate-800/40"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Stats Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            Showing <strong className="text-white">{finalFilteredUsers.length}</strong> active user records
          </div>
        </div>

        {/* User Directory Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          {loadingUsers ? (
            <div className="p-12 text-center text-sm text-slate-400 animate-pulse">Loading system users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">User Profile</th>
                    <th className="px-6 py-3.5">Email Address</th>
                    <th className="px-6 py-3.5">Assigned Role</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {finalFilteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500 text-xs">
                        No users found matching the selected category filter.
                      </td>
                    </tr>
                  ) : (
                    finalFilteredUsers.map((u) => (
                      <tr key={u.id || u.email} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 text-xs shrink-0">
                              {u.full_name?.slice(0, 2).toUpperCase() || "US"}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{u.full_name}</div>
                              <div className="text-[10px] text-slate-500">ID: #{u.id || 1}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-300">{u.email}</td>
                        <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                            ● Active
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" /> Create New System User
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && <div className="p-3 bg-rose-500/20 text-rose-300 text-xs rounded-xl font-semibold">{modalError}</div>}
              {modalSuccess && <div className="p-3 bg-emerald-500/20 text-emerald-300 text-xs rounded-xl font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> {modalSuccess}</div>}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="sarah@cams.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">System Access Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                  >
                    <option value={ROLES.RETAIL_ANALYST}>Retail Analyst</option>
                    <option value={ROLES.STORE_MANAGER}>Store Manager</option>
                    <option value={ROLES.MARKETING_MANAGER}>Marketing Manager</option>
                    <option value={ROLES.ADMINISTRATOR}>Administrator</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md cursor-pointer"
                  >
                    Create User Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
