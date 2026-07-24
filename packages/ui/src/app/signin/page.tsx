'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, LogIn, Coins } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { authApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { setupOrUnwrapDekAtLogin } from '@/lib/crypto/dek-login';

export default function SignInPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: Omit<typeof errors, 'form'> = {};
    if (!email) next.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Invalid email';
    if (!password) next.password = 'Required';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await authApi.signIn({ email, password });
      setSession(res.token, { id: res.id, name: res.name, email: res.email, avatar: res.avatar });
      try {
        await setupOrUnwrapDekAtLogin(res.id, password);
      } catch (dekErr) {
        console.error('Failed to unlock AI encryption key at login', dekErr);
      }
      router.push('/');
    } catch (err: any) {
      setErrors({ form: err.message ?? 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-on-primary">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)] z-0" />

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-6">
        {/* Logo / Title */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-primary border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <Coins className="w-8 h-8 text-on-primary" />
          </div>
          <div>
            <h1 className="font-headline-lg text-primary uppercase tracking-tight leading-none">Pocket Pixel</h1>
            <p className="font-label-caps text-outline text-[11px] mt-1 tracking-widest">EXPENSE TRACKER</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface-container-high border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex flex-col">
          {/* Card header */}
          <header className="px-6 py-4 border-b-4 border-black bg-surface-container flex items-center gap-2">
            <LogIn className="w-5 h-5 text-primary" />
            <h2 className="font-headline-sm text-primary uppercase tracking-wider">Player Login</h2>
          </header>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
            <div className="relative">
              <Mail className="absolute left-3 top-[38px] w-4 h-4 text-outline z-10 pointer-events-none" />
              <Input
                label="Email Address"
                type="email"
                placeholder="hero@guild.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                error={errors.email}
                className="pl-9 mt-1"
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="font-label-caps text-[11px] tracking-wider uppercase">
                  Password
                </label>
                <Link href="/forgot-password" className="font-label-caps text-outline text-[11px] hover:text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <Lock className="absolute left-3 top-[38px] w-4 h-4 text-outline z-10 pointer-events-none" />

              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                error={errors.password}
                className="pl-9"
                autoComplete="current-password"
              />
            </div>

            {errors.form && <p className="font-body-sm text-error text-center">{errors.form}</p>}

            <div className="flex flex-col gap-3 pt-1">
              <Button type="submit" variant="primary" disabled={loading} className="w-full py-3 flex items-center justify-center gap-2 group">
                <LogIn className="w-5 h-5 group-active:scale-90 transition-transform" />
                <span className="font-headline-sm uppercase tracking-wider">Enter the World</span>
              </Button>
            </div>
          </form>

          {/* Footer decor */}
          <div className="px-6 pb-4 pt-0 flex justify-between items-center opacity-30">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 bg-primary border-2 border-black" />
              <div className="w-2.5 h-2.5 bg-secondary border-2 border-black" />
              <div className="w-2.5 h-2.5 bg-tertiary border-2 border-black" />
            </div>
            <p className="font-label-caps text-[9px] tracking-widest">AUTH_V1</p>
          </div>
        </div>

        {/* Switch to signup */}
        <p className="text-center font-body-sm text-on-surface-variant">
          New adventurer? <br />
          <Link href="/signup" className="font-label-caps text-primary hover:underline uppercase tracking-wider">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
