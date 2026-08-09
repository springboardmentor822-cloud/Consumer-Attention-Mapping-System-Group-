import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiCamera,
  FiGrid,
  FiHome,
  FiLogOut,
  FiSettings,
  FiUser,
  FiUsers,
  FiVideo,
  FiActivity,
  FiBarChart2,
  FiTarget,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role?.toLowerCase();

  const getMenuItems = () => {
    const common = [
      { to: "/", label: "Dashboard", icon: FiGrid },
      { to: "/video", label: "Video Processing", icon: FiVideo },
      { to: "/live-tracking", label: "Live Tracking", icon: FiActivity },
      { to: "/cameras", label: "Cameras", icon: FiCamera },
      { to: "/zones", label: "Zones", icon: FiTarget },
      { to: "/profile", label: "Profile", icon: FiUser },
      { to: "/settings", label: "Settings", icon: FiSettings },
    ];

    if (role === "admin") {
      return [
        { to: "/users", label: "Users", icon: FiUsers },
        { to: "/stores", label: "Stores", icon: FiHome },
        ...common,
      ];
    } else if (role === "store manager") {
      return [
        { to: "/stores", label: "Store", icon: FiHome },
        ...common,
      ];
    } else if (role === "retail analyst") {
      return [
        { to: "/analytics", label: "Analytics", icon: FiBarChart2 },
        ...common,
      ];
    } else if (role === "marketing manager") {
      return [
        { to: "/marketing", label: "Marketing", icon: FiTarget },
        ...common,
      ];
    }

    return common;
  };

  const items = getMenuItems();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className="w-72 bg-panel border-r border-line flex-shrink-0 hidden lg:flex flex-col">
        <div className="p-6 border-b border-line">
          <h1 className="text-2xl font-bold text-white">CAMS</h1>
          <p className="text-xs text-slate-400">Retail Intelligence</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-line mt-auto">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-medium transition"
          >
            <FiLogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-line bg-surface/95 backdrop-blur flex items-center px-6 justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">Enterprise Dashboard</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.full_name}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full"></div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;