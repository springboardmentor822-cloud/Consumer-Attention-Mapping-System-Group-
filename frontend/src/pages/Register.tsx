import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '../lib/axios';
import { Mail, Lock, Loader2, AlertCircle, Sparkles } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(5, 'Password must be at least 5 characters'),
  role: z.enum(['Administrator', 'Store Manager', 'Retail Analyst', 'Marketing Manager'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
});

type RegisterFields = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFields) => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.post('/api/auth/register', {
        email: data.email,
        password: data.password,
        role: data.role,
        is_active: true
      });
      setSuccess('Registration request submitted successfully. You can now login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. User may already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050508] flex items-center justify-center overflow-hidden px-4">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-rose-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0d0d12]/80 backdrop-blur-xl border border-slate-800/80 p-8 rounded-2xl shadow-2xl shadow-black/50 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-2 text-indigo-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Request Access Badge</h2>
          <p className="text-sm text-slate-400">Register to create a store manager or analyst profile</p>
        </div>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-lg text-xs">
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-lg flex items-start space-x-3 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-350">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="email"
                placeholder="email@company.com"
                {...register('email')}
                className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 transition"
              />
            </div>
            {errors.email && <span className="text-[10px] text-rose-500">{errors.email.message}</span>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-350">Secure Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 transition"
              />
            </div>
            {errors.password && <span className="text-[10px] text-rose-500">{errors.password.message}</span>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-350">Platform Workspace Role</label>
            <select
              {...register('role')}
              className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg py-2.5 px-3 text-sm text-slate-200 transition cursor-pointer appearance-none"
            >
              <option value="">Select Role Scope...</option>
              <option value="Administrator">Administrator</option>
              <option value="Store Manager">Store Manager</option>
              <option value="Retail Analyst">Retail Analyst</option>
              <option value="Marketing Manager">Marketing Manager</option>
            </select>
            {errors.role && <span className="text-[10px] text-rose-500">{errors.role.message}</span>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 rounded-lg transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering profile...</span>
              </>
            ) : (
              <span>Request Access Badge</span>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 border-t border-slate-900 pt-4">
          <span>Already have a badge? </span>
          <Link to="/login" className="text-indigo-400 hover:underline">Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
