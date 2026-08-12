import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS, ROLE_PAGE_ACCESS, canSeeAllRecords } from "../utils/roles";
import { 
  LayoutDashboard, Store, Map, Layers, Package, ClipboardList, 
  Video, VideoOff, Activity, ShieldAlert, BarChart3, Eye, Clock, 
  MapPin, Route, PieChart, Tag, FileText, Calendar, Download, 
  Users, UserCog, Settings, FileSearch, Bell, User, Search, Megaphone,
  Moon, Sun, ChevronDown, ChevronRight, Menu, LogOut, PanelLeftClose, PanelLeftOpen
} from "lucide-react";

const SIDEBAR_GROUPS = [
  {
    title: "Dashboard",
    items: [
      { to: "/dashboard", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
      { to: "/marketing", label: "Marketing Manager", icon: <Megaphone className="w-4 h-4 text-purple-400" /> }
    ]
  },
  {
    title: "Store Management",
    items: [
      { to: "/store", label: "Store", icon: <Store className="w-4 h-4" /> },
      { to: "/zones", label: "Zones", icon: <Map className="w-4 h-4" /> },
      { to: "/shelves", label: "Shelves", icon: <Layers className="w-4 h-4" /> },
      { to: "/products", label: "Products", icon: <Package className="w-4 h-4" /> },
      { to: "/inventory", label: "Inventory", icon: <ClipboardList className="w-4 h-4" /> },
    ]
  },
  {
    title: "Camera Management",
    items: [
      { to: "/cameras", label: "Live Cameras", icon: <Video className="w-4 h-4" /> },
      { to: "/camera-assignment", label: "Camera Assignment", icon: <VideoOff className="w-4 h-4" /> },
      { to: "/camera-health", label: "Camera Health", icon: <Activity className="w-4 h-4" /> },
    ]
  },
  {
    title: "AI Analytics",
    items: [
      { to: "/analyse", label: "Live Analytics", icon: <BarChart3 className="w-4 h-4" /> },
      { to: "/marketing", label: "Marketing Suite", icon: <Megaphone className="w-4 h-4 text-purple-400" /> },
      { to: "/attention", label: "Attention Analytics", icon: <Eye className="w-4 h-4" /> },
      { to: "/dwell", label: "Dwell Time Analytics", icon: <Clock className="w-4 h-4" /> },
      { to: "/heatmaps", label: "Heatmaps", icon: <MapPin className="w-4 h-4" /> },
      { to: "/journey", label: "Customer Journey", icon: <Route className="w-4 h-4" /> },
      { to: "/product-analytics", label: "Product Analytics", icon: <PieChart className="w-4 h-4" /> },
      { to: "/shelf-analytics", label: "Shelf Analytics", icon: <Tag className="w-4 h-4" /> },
    ]
  },
  {
    title: "Reports",
    items: [
      { to: "/reports", label: "Daily Reports", icon: <FileText className="w-4 h-4" /> },
      { to: "/weekly-reports", label: "Weekly Reports", icon: <Calendar className="w-4 h-4" /> },
      { to: "/monthly-reports", label: "Monthly Reports", icon: <Calendar className="w-4 h-4" /> },
      { to: "/export", label: "Export Reports", icon: <Download className="w-4 h-4" /> },
    ]
  },
  {
    title: "Users",
    items: [
      { to: "/users", label: "Administrators", icon: <UserCog className="w-4 h-4" /> },
      { to: "/managers", label: "Managers", icon: <Users className="w-4 h-4" /> },
      { to: "/analysts", label: "Analysts", icon: <Users className="w-4 h-4" /> },
      { to: "/security", label: "Security", icon: <ShieldAlert className="w-4 h-4" /> },
    ]
  },
  {
    title: "System",
    items: [
      { to: "/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
      { to: "/logs", label: "Logs", icon: <FileSearch className="w-4 h-4" /> },
      { to: "/notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
      { to: "/profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    ]
  }
];

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    "Dashboard": true,
    "Store Management": true,
    "Camera Management": true,
    "AI Analytics": true,
    "Reports": true,
    "Users": true,
    "System": true,
  });

  const userRole = user?.role;
  const isMarketingManager = userRole === "marketing_manager";
  const allowedPages = ROLE_PAGE_ACCESS[userRole] || ["/dashboard"];
  const roleLabel = ROLE_LABELS[userRole] || userRole?.replace("_", " ");
  const isFullAccess = canSeeAllRecords(userRole);

  // Build dynamic sidebar groups
  const dynamicSidebarGroups = isMarketingManager
    ? [
        {
          title: "Dashboard",
          items: [{ to: "/marketing", label: "Marketing Overview", icon: <LayoutDashboard className="w-4 h-4 text-purple-400" /> }]
        },
        {
          title: "Marketing Analytics",
          items: [
            { to: "/marketing", label: "Campaign & Sales Intelligence", icon: <Megaphone className="w-4 h-4 text-purple-400" /> },
            { to: "/analyse", label: "Live Store Analytics", icon: <BarChart3 className="w-4 h-4" /> },
            { to: "/heatmaps", label: "Heatmaps", icon: <MapPin className="w-4 h-4" /> },
            { to: "/journey", label: "Customer Journey", icon: <Route className="w-4 h-4" /> },
            { to: "/product-analytics", label: "Product Performance", icon: <PieChart className="w-4 h-4" /> },
            { to: "/shelf-analytics", label: "Shelf Performance", icon: <Tag className="w-4 h-4" /> },
          ]
        },
        {
          title: "Reports & System",
          items: [
            { to: "/reports", label: "Marketing Reports", icon: <FileText className="w-4 h-4" /> },
            { to: "/notifications", label: "Alerts & Notifications", icon: <Bell className="w-4 h-4" /> },
            { to: "/profile", label: "User Profile", icon: <User className="w-4 h-4" /> },
          ]
        }
      ]
    : [
        {
          title: "Dashboard",
          items: [{ to: "/dashboard", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> }]
        },
        {
          title: "Store Management",
          items: [
            { to: "/store", label: "Store", icon: <Store className="w-4 h-4" /> },
            { to: "/zones", label: "Zones", icon: <Map className="w-4 h-4" /> },
            { to: "/shelves", label: "Shelves", icon: <Layers className="w-4 h-4" /> },
            { to: "/products", label: "Products", icon: <Package className="w-4 h-4" /> },
            { to: "/inventory", label: "Inventory", icon: <ClipboardList className="w-4 h-4" /> },
          ]
        },
        {
          title: "Camera Management",
          items: [
            { to: "/cameras", label: "Live Cameras", icon: <Video className="w-4 h-4" /> },
            { to: "/camera-assignment", label: "Camera Assignment", icon: <VideoOff className="w-4 h-4" /> },
            { to: "/camera-health", label: "Camera Health", icon: <Activity className="w-4 h-4" /> },
          ]
        },
        {
          title: "AI Analytics",
          items: [
            { to: "/analyse", label: "Live Analytics", icon: <BarChart3 className="w-4 h-4" /> },
            { to: "/attention", label: "Attention Analytics", icon: <Eye className="w-4 h-4" /> },
            { to: "/dwell", label: "Dwell Time Analytics", icon: <Clock className="w-4 h-4" /> },
            { to: "/heatmaps", label: "Heatmaps", icon: <MapPin className="w-4 h-4" /> },
            { to: "/journey", label: "Customer Journey", icon: <Route className="w-4 h-4" /> },
            { to: "/product-analytics", label: "Product Analytics", icon: <PieChart className="w-4 h-4" /> },
            { to: "/shelf-analytics", label: "Shelf Analytics", icon: <Tag className="w-4 h-4" /> },
            { to: "/marketing", label: "Marketing Suite", icon: <Megaphone className="w-4 h-4 text-purple-400" /> },
          ]
        },
        {
          title: "Reports",
          items: [
            { to: "/reports", label: "Daily Reports", icon: <FileText className="w-4 h-4" /> },
            { to: "/weekly-reports", label: "Weekly Reports", icon: <Calendar className="w-4 h-4" /> },
            { to: "/monthly-reports", label: "Monthly Reports", icon: <Calendar className="w-4 h-4" /> },
            { to: "/export", label: "Export Reports", icon: <Download className="w-4 h-4" /> },
          ]
        },
        {
          title: "Users",
          items: [
            { to: "/users", label: "Administrators", icon: <UserCog className="w-4 h-4" /> },
            { to: "/managers", label: "Managers", icon: <Users className="w-4 h-4" /> },
            { to: "/analysts", label: "Analysts", icon: <Users className="w-4 h-4" /> },
            { to: "/security", label: "Security", icon: <ShieldAlert className="w-4 h-4" /> },
          ]
        },
        {
          title: "System",
          items: [
            { to: "/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
            { to: "/logs", label: "Logs", icon: <FileSearch className="w-4 h-4" /> },
            { to: "/notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
            { to: "/profile", label: "Profile", icon: <User className="w-4 h-4" /> },
          ]
        }
      ];

  const toggleGroup = (groupTitle) => {
    if (collapsed) {
      setCollapsed(false);
      setExpandedGroups({ ...expandedGroups, [groupTitle]: true });
      return;
    }
    setExpandedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  function handleLogout() {
    logout();
    navigate("/login");
  }

  // Format date for header
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen flex bg-[#0b1121] text-slate-300 font-sans overflow-hidden">
      
      {/* Collapsible Sidebar */}
      <aside 
        className={`${collapsed ? 'w-20' : 'w-72'} transition-all duration-300 ease-in-out bg-[#060b14] border-r border-slate-800 flex flex-col relative z-20 shadow-2xl`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {!collapsed && (
            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-wide">Enterprise AI</span>
                <span className="text-[10px] text-indigo-400 font-medium tracking-widest uppercase">Retail Analytics</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">
                <LayoutDashboard className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-1">
          {dynamicSidebarGroups.map((group, idx) => (
            <div key={idx} className="mb-2">
              <button
                onClick={() => toggleGroup(group.title)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? group.title : ""}
              >
                {!collapsed && <span className="text-[11px] font-bold uppercase tracking-wider">{group.title}</span>}
                {collapsed && <span className="w-2 h-2 rounded-full bg-slate-600"></span>}
                {!collapsed && (
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedGroups[group.title] ? 'rotate-180' : ''}`} />
                )}
              </button>
              
              {(!collapsed && expandedGroups[group.title]) && (
                <div className="mt-1 space-y-1 ml-1">
                  {group.items.map((item, itemIdx) => (
                    <NavLink
                      key={itemIdx}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                          isActive || (item.to === "/dashboard" && location.pathname === "/admin")
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                            : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                        }`
                      }
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800">
          {!collapsed ? (
            <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 p-3 rounded-xl mb-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">{user?.full_name || "Admin User"}</div>
                  <div className="text-[10px] text-indigo-400 font-medium truncate">{roleLabel}</div>
                </div>
              </div>
            </div>
          ) : (
             <div className="flex justify-center mb-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold" title={user?.full_name || "Admin User"}>
                  <User className="w-4 h-4" />
                </div>
             </div>
          )}
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-red-500/10 hover:text-red-400 border border-slate-700 hover:border-red-500/30 text-slate-300 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer ${collapsed ? 'px-0' : 'px-4'}`}
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0b1121] relative h-screen">
        
        {/* Top Header */}
        <header className="h-16 bg-[#0b1121]/80 backdrop-blur-md border-b border-slate-800 flex justify-between items-center px-4 lg:px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors"
            >
              {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-bold text-white hidden sm:block tracking-tight">{title}</h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
              <Calendar className="w-3.5 h-3.5" />
              {currentDate}
            </div>

            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="bg-slate-900 border border-slate-700 text-sm rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 w-48 lg:w-64 transition-all"
              />
            </div>

            {/* Store Selector */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-700/80 transition-colors">
              <Store className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-white">AK retail store</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            <div className="flex items-center gap-2 border-l border-slate-700 pl-4 sm:pl-6">
              {/* Theme Toggle (Placeholder) */}
              <button className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <Sun className="w-5 h-5" />
              </button>
              
              {/* Notifications */}
              <button className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#0b1121]"></span>
              </button>

              {/* Profile Dropdown (Simplified) */}
              <div className="flex items-center gap-2 ml-2 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-slate-600 shadow-md">
                  <span className="text-white font-bold text-xs">AU</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#0b1121] to-[#0b1121] pointer-events-none"></div>
          <div className="relative z-10 max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
