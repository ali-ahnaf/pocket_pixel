'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!password) return 'Password required';
    if (password.length < 6) return 'Min 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const err = validate();
    if (err) return setError(err);

    setError(null);
    setLoading(true);

    try {
      // MOCK API CALL (frontend only)
      await new Promise((r) => setTimeout(r, 800));

      router.push('/signin');
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center p-4">
      {/* scanline */}
      <div className="pointer-events-none fixed inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)] z-0" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-surface-container-high border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
          {/* Header */}
          <div className="px-6 py-4 border-b-4 border-black bg-surface-container flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="font-headline-sm text-primary uppercase tracking-wider">Reset Password</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              autoComplete="new-password"
              error={error || undefined}
            />

            <Button type="submit" disabled={loading} className="w-full py-3" variant="primary">
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
