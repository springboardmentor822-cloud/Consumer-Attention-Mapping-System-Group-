"use client";
import React from 'react';

export default function RoleMgmtTab() {
  const handleEditRole = (roleName: string) => {
    alert(`Opening permission matrix and access control editor for role: ${roleName}`);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-200">Role Management</h3>
          <p className="text-xs text-slate-400 mt-1">Configure role-based access control (RBAC) and security tiers.</p>
        </div>
      </div>
      
      <table className="w-full text-left text-sm text-slate-300 border border-slate-800 rounded-lg overflow-hidden">
        <thead className="bg-slate-950 text-slate-400">
          <tr>
            <th className="p-4">Role Name</th>
            <th className="p-4">Active Users</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          <tr className="hover:bg-slate-800/40 transition-colors">
            <td className="p-4 font-bold text-cyan-400">Store Manager</td>
            <td className="p-4">12</td>
            <td className="p-4 text-right">
              <button 
                onClick={() => handleEditRole("Store Manager")}
                className="text-slate-400 hover:text-cyan-400 font-semibold cursor-pointer transition-colors"
              >
                Edit
              </button>
            </td>
          </tr>
          <tr className="hover:bg-slate-800/40 transition-colors">
            <td className="p-4 font-bold text-purple-400">Retail Analyst</td>
            <td className="p-4">5</td>
            <td className="p-4 text-right">
              <button 
                onClick={() => handleEditRole("Retail Analyst")}
                className="text-slate-400 hover:text-cyan-400 font-semibold cursor-pointer transition-colors"
              >
                Edit
              </button>
            </td>
          </tr>
          <tr className="hover:bg-slate-800/40 transition-colors">
            <td className="p-4 font-bold text-emerald-400">Marketing Manager</td>
            <td className="p-4">3</td>
            <td className="p-4 text-right">
              <button 
                onClick={() => handleEditRole("Marketing Manager")}
                className="text-slate-400 hover:text-cyan-400 font-semibold cursor-pointer transition-colors"
              >
                Edit
              </button>
            </td>
          </tr>
          <tr className="hover:bg-slate-800/40 transition-colors">
            <td className="p-4 font-bold text-rose-400">Administrator</td>
            <td className="p-4">2</td>
            <td className="p-4 text-right">
              <button 
                onClick={() => handleEditRole("Administrator")}
                className="text-slate-400 hover:text-cyan-400 font-semibold cursor-pointer transition-colors"
              >
                Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}