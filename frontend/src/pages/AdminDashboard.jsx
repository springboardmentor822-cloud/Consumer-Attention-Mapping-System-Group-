import React from 'react';
import { 
  Shield, LayoutDashboard, Users, UserCog, Lock, Clock, Store, Video, 
  Cpu, Activity, HeartPulse, Zap, ShieldAlert, FileText, ClipboardList, 
  Settings, BellRing, DatabaseBackup, Mail, HelpCircle, BookOpen, Search,
  Calendar, Bell, ChevronDown, Camera, AlertTriangle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

// Dummy Data
const systemPerformanceData = [
  { name: 'May 21', cpu: 65, memory: 45, disk: 25, network: 15 },
  { name: 'May 22', cpu: 68, memory: 42, disk: 22, network: 20 },
  { name: 'May 23', cpu: 75, memory: 48, disk: 24, network: 18 },
  { name: 'May 24', cpu: 62, memory: 40, disk: 25, network: 22 },
  { name: 'May 25', cpu: 70, memory: 45, disk: 28, network: 25 },
  { name: 'May 26', cpu: 78, memory: 50, disk: 26, network: 19 },
  { name: 'May 27', cpu: 82, memory: 55, disk: 27, network: 24 },
];

const cameraStatusData = [
  { name: 'Online', value: 138, color: '#22c55e' },
  { name: 'Offline', value: 12, color: '#ef4444' },
  { name: 'Maintenance', value: 4, color: '#eab308' },
  { name: 'Error', value: 2, color: '#a855f7' },
];

const apiPerformanceData = [
  { name: 'May 21', time: 500 },
  { name: 'May 22', time: 550 },
  { name: 'May 23', time: 800 },
  { name: 'May 24', time: 450 },
  { name: 'May 25', time: 600 },
  { name: 'May 26', time: 520 },
  { name: 'May 27', time: 500 },
];

const userRoleData = [
  { name: 'Store Manager', value: 56, color: '#3b82f6' },
  { name: 'Retail Analyst', value: 32, color: '#22c55e' },
  { name: 'Marketing Manager', value: 22, color: '#eab308' },
  { name: 'Store Staff', value: 20, color: '#ef4444' },
  { name: 'Administrator', value: 12, color: '#a855f7' },
];

const topStoresData = [
  { name: 'Store 01 - City Mall', visitors: '12,845', interactions: '8,436', rate: '24.6%' },
  { name: 'Store 02 - Downtown', visitors: '9,234', interactions: '6,721', rate: '22.8%' },
  { name: 'Store 03 - Metro Plaza', visitors: '8,921', interactions: '6,125', rate: '21.4%' },
  { name: 'Store 04 - AK retail store', visitors: '7,432', interactions: '5,213', rate: '20.1%' },
  { name: 'Store 05 - Grand Plaza', visitors: '6,789', interactions: '4,321', rate: '18.7%' },
];

const alertsSummary = [
  { title: 'Camera Offline', desc: 'Camera 12 in AK retail store is offline', time: '10:24 AM', count: 5, icon: AlertTriangle, color: 'text-red-500' },
  { title: 'High CPU Usage', desc: 'Server CPU usage is above 80%', time: '09:58 AM', count: 2, icon: AlertTriangle, color: 'text-yellow-500' },
  { title: 'High Memory Usage', desc: 'Server memory usage is high', time: '09:45 AM', count: 1, icon: AlertTriangle, color: 'text-yellow-500' },
  { title: 'API Response Delay', desc: 'API response time is above threshold', time: '09:30 AM', count: 3, icon: AlertTriangle, color: 'text-blue-500' },
  { title: 'Disk Space Low', desc: 'Disk space remaining less than 10%', time: '09:12 AM', count: 1, icon: AlertTriangle, color: 'text-red-500' },
];

const recentActivities = [
  { icon: Camera, color: 'text-red-500', bg: 'bg-red-500/10', title: 'Camera 12 in AK retail store went offline', time: '10:24 AM', tag: 'Camera', tagColor: 'bg-red-500/20 text-red-400' },
  { icon: Users, color: 'text-green-500', bg: 'bg-green-500/10', title: 'User john.doe@store.com logged in', time: '10:18 AM', tag: 'User', tagColor: 'bg-green-500/20 text-green-400' },
  { icon: DatabaseBackup, color: 'text-blue-500', bg: 'bg-blue-500/10', title: 'Backup completed successfully', time: '10:15 AM', tag: 'System', tagColor: 'bg-blue-500/20 text-blue-400' },
  { icon: UserCog, color: 'text-green-500', bg: 'bg-green-500/10', title: 'New user jane.smith@admin.com created', time: '10:10 AM', tag: 'User', tagColor: 'bg-green-500/20 text-green-400' },
  { icon: Settings, color: 'text-purple-500', bg: 'bg-purple-500/10', title: 'Settings updated for Store 03', time: '10:05 AM', tag: 'Settings', tagColor: 'bg-purple-500/20 text-purple-400' },
];

const databaseOverview = [
  { name: 'cams_main_db', status: 'Healthy', size: '890 GB', connections: 84, health: '99.9%' },
  { name: 'analytics_db', status: 'Healthy', size: '750 GB', connections: 62, health: '99.8%' },
  { name: 'logs_db', status: 'Healthy', size: '520 GB', connections: 28, health: '99.9%' },
  { name: 'users_db', status: 'Healthy', size: '320 GB', connections: 12, health: '99.7%' },
];

export default function AdminDashboard() {
  return (
    <div className="flex h-screen bg-[#0b1120] text-slate-300 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#060b14] border-r border-slate-800 flex flex-col overflow-y-auto">
        <div className="p-4 flex items-center gap-3 border-b border-slate-800">
          <Shield className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="font-bold text-white text-lg leading-tight">ADMIN DASHBOARD</h1>
            <p className="text-xs text-slate-500">System Control Center</p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-6">
          
          {/* Section: OVERVIEW */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> OVERVIEW
            </h2>
            <div className="bg-blue-600 rounded-lg p-2 flex items-center gap-3 text-white">
              <LayoutDashboard className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Dashboard Overview</p>
                <p className="text-[10px] text-blue-200">System summary & key metrics</p>
              </div>
            </div>
          </div>

          {/* Section: USER & ACCESS */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> USER & ACCESS MANAGEMENT
            </h2>
            <ul className="space-y-1">
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <Users className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">User Management</p>
                  <p className="text-[10px] text-slate-500">Manage users & accounts</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <UserCog className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">Role Management</p>
                  <p className="text-[10px] text-slate-500">Manage roles & permissions</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <Lock className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">Permission Management</p>
                  <p className="text-[10px] text-slate-500">Set module permissions</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">Session Management</p>
                  <p className="text-[10px] text-slate-500">Active sessions & logs</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Section: STORE & DEVICE */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> STORE & DEVICE MANAGEMENT
            </h2>
            <ul className="space-y-1">
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <Store className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">Store Management</p>
                  <p className="text-[10px] text-slate-500">Manage all stores</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <Video className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">Camera Management</p>
                  <p className="text-[10px] text-slate-500">Manage cameras & streams</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <Cpu className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">Device Management</p>
                  <p className="text-[10px] text-slate-500">Manage IoT devices</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <Activity className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">Device Health</p>
                  <p className="text-[10px] text-slate-500">Monitor device status</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Section: ANALYTICS & MONITORING */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> ANALYTICS & MONITORING
            </h2>
            <ul className="space-y-1">
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <HeartPulse className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">System Overview</p>
                  <p className="text-[10px] text-slate-500">System health & performance</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <Zap className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">Infrastructure Monitor</p>
                  <p className="text-[10px] text-slate-500">Servers, DB & services</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <Activity className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">API Performance</p>
                  <p className="text-[10px] text-slate-500">API usage & response time</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <ShieldAlert className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">Security Monitoring</p>
                  <p className="text-[10px] text-slate-500">Security events & threats</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Section: LOGS & AUDIT */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> LOGS & AUDIT
            </h2>
            <ul className="space-y-1">
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <FileText className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">Audit Logs</p>
                  <p className="text-[10px] text-slate-500">System audit trail</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <ClipboardList className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">Activity Logs</p>
                  <p className="text-[10px] text-slate-500">User & system activities</p>
                </div>
              </li>
            </ul>
          </div>
          
          {/* Section: SYSTEM CONFIGURATION */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> SYSTEM CONFIGURATION
            </h2>
            <ul className="space-y-1">
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <Settings className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">System Settings</p>
                  <p className="text-[10px] text-slate-500">General system settings</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <BellRing className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">Alert Configuration</p>
                  <p className="text-[10px] text-slate-500">Manage alert rules</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <DatabaseBackup className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">Backup & Restore</p>
                  <p className="text-[10px] text-slate-500">Backup, restore & recovery</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">Notification Settings</p>
                  <p className="text-[10px] text-slate-500">Email, SMS & push config</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Section: HELP & SUPPORT */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> HELP & SUPPORT
            </h2>
            <ul className="space-y-1 pb-4">
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">Support Tickets</p>
                  <p className="text-[10px] text-slate-500">Manage support requests</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm">System Documentation</p>
                  <p className="text-[10px] text-slate-500">Guides and API docs</p>
                </div>
              </li>
            </ul>
          </div>

        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#0f172a] p-4 lg:p-6 custom-scrollbar">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
            <p className="text-sm text-slate-400">Welcome back, Administrator</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm">May 21 – May 27, 2025</span>
              <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
            </div>
            
            <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            
            <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors relative">
              <Bell className="w-5 h-5 text-slate-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold border border-slate-900">12</span>
            </div>
            
            <div className="flex items-center gap-3 ml-2">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold overflow-hidden border border-slate-600">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Admin`} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-white">Admin User</p>
                <p className="text-[10px] text-slate-400">Super Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-lg shadow-black/20">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Store className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium mb-1">Total Stores</p>
              <h3 className="text-3xl font-bold text-white mb-2">28</h3>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="font-bold">↑ 7.69%</span> vs last week
              </p>
            </div>
          </div>
          
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-lg shadow-black/20">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium mb-1">Total Users</p>
              <h3 className="text-3xl font-bold text-white mb-2">142</h3>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="font-bold">↑ 8.33%</span> vs last week
              </p>
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-lg shadow-black/20">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Video className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium mb-1">Total Cameras</p>
              <h3 className="text-3xl font-bold text-white mb-2">156</h3>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="font-bold">↑ 5.41%</span> vs last week
              </p>
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-lg shadow-black/20 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-500"></div>
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-medium">Cameras Online</p>
                <p className="text-lg font-bold text-white">138</p>
                <p className="text-[10px] text-yellow-500">88.46% of total</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400 font-medium mb-1">System Uptime</p>
              <h3 className="text-3xl font-bold text-white mb-2">99.85%</h3>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="font-bold">↑ 0.32%</span> vs last week
              </p>
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-lg shadow-black/20">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <BellRing className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium mb-1">Active Alerts</p>
              <h3 className="text-3xl font-bold text-white mb-2">12</h3>
              <p className="text-xs text-red-400 flex items-center gap-1">
                <span className="font-bold">↓ 14.29%</span> vs last week
              </p>
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {/* Line Chart */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 xl:col-span-2 shadow-lg shadow-black/20">
            <h3 className="text-sm font-semibold text-white mb-4">System Performance (Last 7 Days)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={systemPerformanceData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} itemStyle={{color: '#fff'}} />
                  <Line type="monotone" dataKey="cpu" name="CPU Usage (%)" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="memory" name="Memory Usage (%)" stroke="#22c55e" strokeWidth={3} dot={{r: 4}} />
                  <Line type="monotone" dataKey="disk" name="Disk Usage (%)" stroke="#eab308" strokeWidth={3} dot={{r: 4}} />
                  <Line type="monotone" dataKey="network" name="Network I/O (Mbps)" stroke="#a855f7" strokeWidth={3} dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> CPU Usage (%)</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Memory Usage (%)</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Disk Usage (%)</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Network I/O (Mbps)</div>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-lg shadow-black/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white">Camera Status Overview</h3>
              <a href="#" className="text-xs text-blue-400 hover:underline">View All</a>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={cameraStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {cameraStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '8px'}} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-white">156</span>
                  <span className="text-xs text-slate-400">Total Cameras</span>
                </div>
              </div>
              <div className="w-full mt-4 space-y-2">
                {cameraStatusData.map((status, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{backgroundColor: status.color}}></span>
                      <span className="text-slate-300">{status.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">{status.value}</span>
                      <span className="text-slate-500 w-12 text-right">({((status.value/156)*100).toFixed(2)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alerts List */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-lg shadow-black/20 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white">Alerts Summary</h3>
              <a href="#" className="text-xs text-blue-400 hover:underline">View All</a>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              {alertsSummary.map((alert, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <alert.icon className={`w-5 h-5 mt-0.5 ${alert.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{alert.title}</p>
                    <p className="text-xs text-slate-400 truncate">{alert.desc}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-slate-500">{alert.time}</span>
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">{alert.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Third Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          
          {/* Top Stores Table */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-lg shadow-black/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white">Top Stores by Activity</h3>
              <a href="#" className="text-xs text-blue-400 hover:underline">View All</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700/50">
                    <th className="pb-2 font-medium">Store</th>
                    <th className="pb-2 font-medium">Visitors</th>
                    <th className="pb-2 font-medium">Interactions</th>
                    <th className="pb-2 font-medium">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {topStoresData.map((store, idx) => (
                    <tr key={idx} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                      <td className="py-2.5">{store.name}</td>
                      <td className="py-2.5 font-medium">{store.visitors}</td>
                      <td className="py-2.5 font-medium">{store.interactions}</td>
                      <td className="py-2.5 text-green-400 flex items-center gap-1">
                        {store.rate} <span className="text-[10px]">↗</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Area Chart */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-lg shadow-black/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white">API Performance <span className="text-slate-400 text-xs font-normal">(Average Response Time)</span></h3>
              <div className="bg-slate-800 rounded px-2 py-1 text-xs border border-slate-700 flex items-center gap-1 cursor-pointer">
                Last 7 Days <ChevronDown className="w-3 h-3" />
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={apiPerformanceData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} itemStyle={{color: '#fff'}} />
                  <Area type="monotone" dataKey="time" stroke="#a855f7" fillOpacity={1} fill="url(#colorTime)" strokeWidth={2} activeDot={{r: 6}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Infrastructure Health */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-lg shadow-black/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white">Infrastructure Health</h3>
              <a href="#" className="text-xs text-blue-400 hover:underline">View All</a>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Database Server', val: 99.9, status: 'Healthy', color: 'bg-green-500', tColor: 'text-green-500' },
                { name: 'API Server', val: 99.7, status: 'Healthy', color: 'bg-green-500', tColor: 'text-green-500' },
                { name: 'Stream Processing', val: 99.8, status: 'Healthy', color: 'bg-green-500', tColor: 'text-green-500' },
                { name: 'AI Inference Engine', val: 97.2, status: 'Warning', color: 'bg-yellow-500', tColor: 'text-yellow-500' },
                { name: 'File Storage', val: 99.9, status: 'Healthy', color: 'bg-green-500', tColor: 'text-green-500' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">{item.name}</span>
                      <div className="flex gap-4">
                        <span className={item.tColor}>{item.status}</span>
                        <span className="text-slate-400 font-mono">{item.val}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Fourth Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          
          {/* Recent System Activities */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-lg shadow-black/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white">Recent System Activities</h3>
              <a href="#" className="text-xs text-blue-400 hover:underline">View All</a>
            </div>
            <div className="relative border-l border-slate-700 ml-3 space-y-5 pb-2">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="relative pl-6">
                  <span className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full ${act.bg} border-2 border-[#1e293b] flex items-center justify-center`}>
                    <span className={`w-2 h-2 rounded-full ${act.color.replace('text-', 'bg-')}`}></span>
                  </span>
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-500 font-mono mt-0.5">{act.time}</span>
                    <span className={`text-[9px] font-medium px-2 py-0.5 rounded ${act.tagColor}`}>{act.tag}</span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{act.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Database Overview */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 xl:col-span-2 shadow-lg shadow-black/20 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white">Database Overview</h3>
              <a href="#" className="text-xs text-blue-400 hover:underline">View All</a>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-6 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <DatabaseBackup className="w-4 h-4" /> <span className="text-xs font-medium">Total Databases</span>
                </div>
                <div className="text-xl font-bold text-white">4 <span className="text-xs font-normal text-slate-500 ml-1">Active</span></div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <FileText className="w-4 h-4" /> <span className="text-xs font-medium">Total Size</span>
                </div>
                <div className="text-xl font-bold text-white">2.45 TB <span className="text-xs font-normal text-slate-500 ml-1">Used</span></div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Users className="w-4 h-4" /> <span className="text-xs font-medium">Connections</span>
                </div>
                <div className="text-xl font-bold text-white">186 <span className="text-xs font-normal text-slate-500 ml-1">Active</span></div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Activity className="w-4 h-4" /> <span className="text-xs font-medium">Query / Sec</span>
                </div>
                <div className="text-xl font-bold text-white">245 <span className="text-xs font-normal text-slate-500 ml-1">Average</span></div>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700/50">
                    <th className="pb-2 font-medium">Database Name</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Size</th>
                    <th className="pb-2 font-medium">Connections</th>
                    <th className="pb-2 font-medium text-right">Health</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {databaseOverview.map((db, idx) => (
                    <tr key={idx} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                      <td className="py-2 font-medium">{db.name}</td>
                      <td className="py-2 text-green-500 text-xs">{db.status}</td>
                      <td className="py-2 font-mono text-xs text-slate-400">{db.size}</td>
                      <td className="py-2">{db.connections}</td>
                      <td className="py-2 text-right text-slate-400 font-mono">{db.health}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Distribution */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-lg shadow-black/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white">User Distribution by Role</h3>
              <a href="#" className="text-xs text-blue-400 hover:underline">View All</a>
            </div>
            
            <div className="flex flex-col h-[280px]">
              <div className="flex-1 relative mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={userRoleData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                      {userRoleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '8px'}} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-white">142</span>
                  <span className="text-[10px] text-slate-400">Total Users</span>
                </div>
              </div>
              
              <div className="space-y-2 mt-auto">
                {userRoleData.map((role, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: role.color}}></span>
                      <span className="text-slate-300">{role.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{role.value}</span>
                      <span className="text-slate-500 w-10 text-right">({((role.value/142)*100).toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a;
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
