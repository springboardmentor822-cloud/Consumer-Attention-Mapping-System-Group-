import * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/toast';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const { mutate: handleLogin, isPending: submitting } = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      toast({ title: 'Login successful', description: 'You are now signed in.', type: 'success' });
      let dest = from;
      if (from === '/dashboard' || from === '/') {
        switch (user.role) {
          case 'SuperAdmin':
            dest = '/admin/dashboard';
            break;
          case 'StoreManager':
            dest = '/manager/dashboard';
            break;
          case 'Analyst':
            dest = '/analyst/dashboard';
            break;
          default:
            dest = '/dashboard';
        }
      }
      navigate(dest, { replace: true });
    },
    onError: (error) => {
      const message = axios.isAxiosError(error) ? error.response?.data?.detail || error.message : error instanceof Error ? error.message : 'Invalid credentials';
      toast({ title: 'Login failed', description: message, type: 'error' });
    }
  });

  const onSubmit = (values: LoginFormValues) => {
    handleLogin(values);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_26%),linear-gradient(180deg,#f8fafc,#e2e8f0)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.13),_transparent_30%),linear-gradient(180deg,#020617,#0f172a)]">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="max-w-xl text-slate-900 dark:text-slate-50">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">Consumer Attention Mapping System</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">AI-Powered Retail Intelligence Platform</h1>
          <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">Monitor retail environments, manage stores, organize shelf layouts, configure camera sources, and access intelligent retail insights through a secure management platform.</p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="rounded-full border border-slate-300/70 bg-white/70 px-4 py-2 backdrop-blur dark:border-white/10 dark:bg-white/5">Real-Time Insights</span>
            <span className="rounded-full border border-slate-300/70 bg-white/70 px-4 py-2 backdrop-blur dark:border-white/10 dark:bg-white/5">Access Control</span>
            <span className="rounded-full border border-slate-300/70 bg-white/70 px-4 py-2 backdrop-blur dark:border-white/10 dark:bg-white/5">Operational Analytics</span>
          </div>
        </div>

        <Card className="border-border/60 bg-card/95 shadow-soft backdrop-blur">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use your work email to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" className="pl-9" placeholder="name@company.com" {...register('email')} />
                </div>
                {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" className="pl-9" placeholder="Enter your password" {...register('password')} />
                </div>
                {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? 'Signing in...' : 'Login'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
              <button type="button" className="hover:text-foreground">Forgot password?</button>
              <Link to="/register" className="font-medium text-foreground hover:underline">
                Create account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
