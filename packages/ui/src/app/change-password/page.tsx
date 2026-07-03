'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/hooks/useAuth';
import { profileApi } from '@/lib/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!currentPassword) return 'Current password required';
    if (newPassword.length < 8) return 'New password must be at least 8 characters';
    if (newPassword !== confirmPassword) return 'New passwords do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user?.id) {
      setError('You must be signed in to change your password');
      return;
    }

    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await profileApi.changePassword(user.id, { currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message = profileApi.parseError(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center p-4">
      {/* scanline */}
      <div className="pointer-events-none fixed inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)] z-0" />

      <div className="relative z-10 w-full max-w-sm">
        <button type="button" onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-on-background hover:text-primary transition-colors font-label-caps tracking-wider uppercase">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-surface-container-high border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
          {/* Header */}
          <div className="px-6 py-4 border-b-4 border-black bg-surface-container flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            <h2 className="font-headline-sm text-primary uppercase tracking-wider">Change Password</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setError(null);
              }}
              autoComplete="current-password"
            />

            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError(null);
              }}
              autoComplete="new-password"
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              autoComplete="new-password"
              error={error || undefined}
            />

            {success && <p className="font-mono text-label-caps text-primary uppercase border-4 border-black bg-surface-container p-3">Password changed successfully</p>}

            <Button type="submit" disabled={loading} className="w-full py-3" variant="primary">
              {loading ? 'Saving…' : 'Change Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
