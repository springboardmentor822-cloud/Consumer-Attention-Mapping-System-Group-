import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '../lib/axios';
import { Search, Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';

const userSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  role_id: z.preprocess((val) => Number(val), z.number().min(1, 'Please select a Role')),
  is_active: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserItem {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
}

export default function UsersCRUD() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      is_active: true
    }
  });

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get<UserItem[]>('/api/auth/users');
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data: UserFormValues) => {
    try {
      if (editingUser) {
        await apiClient.put(`/api/auth/users/${editingUser.id}`, {
          role_id: data.role_id,
          is_active: data.is_active
        });
      } else {
        await apiClient.post('/api/auth/register', {
          email: data.email,
          password: data.password || "default123",
          role_id: data.role_id
        });
      }
      setModalOpen(false);
      setEditingUser(null);
      reset();
      fetchUsers();
    } catch (err) {
      alert("Error saving user account information");
    }
  };

  const handleEdit = (user: UserItem) => {
    setEditingUser(user);
    setValue('email', user.email);
    // Map role name string back to ID for selector matching
    const roleId = user.role === "Administrator" ? 4 : user.role === "Marketing" ? 3 : user.role === "Analyst" ? 2 : 1;
    setValue('role_id', roleId);
    setValue('is_active', user.is_active);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user profile?")) return;
    try {
      await apiClient.delete(`/api/auth/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert("Error deleting user account");
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-200">User Access Credentials</h2>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Configure client dashboard permissions & role assignments</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); reset(); setModalOpen(true); }}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          <span>Provision User</span>
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search users by email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1b1b24] border border-slate-850 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <RefreshCw className="animate-spin text-indigo-500 w-8 h-8" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-350">
            <thead className="bg-slate-900/50 uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User Email Address</th>
                <th className="py-3 px-4">Dashboard Role</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/30">
                  <td className="py-3 px-4 font-bold text-slate-200">{u.email}</td>
                  <td className="py-3 px-4"><span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-400">{u.role}</span></td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      u.is_active ? "bg-emerald-950/60 text-emerald-400" : "bg-rose-955/65 text-rose-450"
                    }`}>
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center space-x-2">
                    <button onClick={() => handleEdit(u)} className="p-1 hover:text-indigo-400 text-slate-500 transition"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(u.id)} className="p-1 hover:text-rose-455 text-slate-500 transition"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#12121a] border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">{editingUser ? 'Edit User Credentials' : 'Provision User Credentials'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Email Address</label>
                <input
                  type="email"
                  disabled={!!editingUser}
                  {...register('email')}
                  placeholder="e.g. manager@store.com"
                  className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                {errors.email && <span className="text-[10px] text-rose-500">{errors.email.message}</span>}
              </div>

              {!editingUser && (
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Password</label>
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="Enter password..."
                    className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  {errors.password && <span className="text-[10px] text-rose-500">{errors.password.message}</span>}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Dashboard Role</label>
                <select
                  {...register('role_id')}
                  className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">Select Role...</option>
                  <option value="1">Store Manager</option>
                  <option value="2">Retail Analyst</option>
                  <option value="3">Marketing Manager</option>
                  <option value="4">Administrator</option>
                </select>
                {errors.role_id && <span className="text-[10px] text-rose-500">{errors.role_id.message}</span>}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  {...register('is_active')}
                  className="bg-[#1b1b24] border border-slate-800 rounded text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                />
                <label htmlFor="is_active" className="text-slate-400 font-semibold cursor-pointer">Account Active Status</label>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-2.5 rounded transition"
              >
                Save User Credentials
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
