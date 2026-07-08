import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowRight, LockKeyhole, Mail, Shield } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/toast';
import type { RoleName } from '../../types/auth';

const registerSchema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
    role: z.enum(['Administrator', 'Store Manager', 'Retail Analyst', 'Marketing Manager']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const roleOptions: RoleName[] = ['Store Manager', 'Retail Analyst', 'Marketing Manager'];

export function RegisterPage(): JSX.Element {
  const navigate = useNavigate();
  const { register: registerAccount } = useAuth();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', role: 'Store Manager' },
  });

  const { mutate: handleRegister, isPending: submitting } = useMutation({
    mutationFn: (values: RegisterFormValues) => registerAccount({ email: values.email, password: values.password, role: values.role }),
    onSuccess: () => {
      toast({ title: 'Registration successful', description: 'Please login with your new account.', type: 'success' });
      navigate('/login', { replace: true });
    },
    onError: (error) => {
      const message = axios.isAxiosError(error) ? error.response?.data?.detail || error.message : error instanceof Error ? error.message : 'Please try again.';
      toast({ title: 'Registration failed', description: message, type: 'error' });
    }
  });

  const onSubmit = (values: RegisterFormValues) => {
    handleRegister(values);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(234,179,8,0.16),_transparent_26%),linear-gradient(180deg,#f8fafc,#e2e8f0)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_30%),linear-gradient(180deg,#020617,#0f172a)]">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="order-2 border-border/60 bg-card/95 shadow-soft backdrop-blur lg:order-1">
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Select your assigned system role to access retail insights.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="register-email" type="email" className="pl-9" placeholder="name@company.com" {...register('email')} />
                </div>
                {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="register-password" type="password" className="pl-9" placeholder="Create a password" {...register('password')} />
                  </div>
                  {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="confirm-password" type="password" className="pl-9" placeholder="Confirm password" {...register('confirmPassword')} />
                  </div>
                  {errors.confirmPassword ? <p className="text-sm text-destructive">{errors.confirmPassword.message}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <div className="relative">
                  <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select id="role" className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register('role')}>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.role ? <p className="text-sm text-destructive">{errors.role.message}</p> : null}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? 'Creating account...' : 'Register'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-5 text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-foreground hover:underline">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="order-1 max-w-xl text-slate-900 dark:text-slate-50 lg:order-2">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-300">System Access Control</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Enterprise-grade retail attention tracking and behavior analysis.</h1>
          <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">Monitor consumer engagements, store metrics, and video feeds through a centralized administrative dashboard.</p>
        </div>
      </div>
    </div>
  );
}
