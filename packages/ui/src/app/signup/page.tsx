'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, UserPlus, Coins } from 'lucide-react';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { AVATARS } from '@/lib/helpers/static';
import { AvatarPickerModal } from '@/components/AvatarPickerModal';
import { authApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function SignUpPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: Omit<typeof errors, 'form'> = {};
    if (!name.trim()) next.name = 'Required';
    if (!email) next.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Invalid email';
    if (!password) next.password = 'Required';
    else if (password.length < 8) next.password = 'Min 8 characters';
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
      const res = (await authApi.signUp({ name, email, password, avatar: selectedAvatar })) as any;
      setSession({ id: res.id, name: res.name, email: res.email, avatar: res.avatar });
      router.push('/');
    } catch (err: any) {
      setErrors({ form: err.message ?? 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-4 py-10 selection:bg-primary selection:text-on-primary">
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
            <UserPlus className="w-5 h-5 text-secondary" />
            <h2 className="font-headline-sm text-secondary uppercase tracking-wider">Create Hero</h2>
          </header>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
            {/* Avatar picker */}
            <div className="flex flex-col gap-2">
              <p className="pixel-input-label flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Choose Avatar
              </p>

              {/* Selected avatar preview */}
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="w-full flex items-center gap-4 p-3 bg-surface-container border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.06),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)] hover:bg-surface-container-high transition-colors text-left"
              >
                <div className="w-14 h-14 border-4 border-primary shadow-[2px_2px_0_0_rgba(0,0,0,1)] shrink-0 overflow-hidden">
                  <img src={selectedAvatar} alt="Selected avatar" className="w-full h-full object-cover [image-rendering:pixelated]" />
                </div>
                <div className="flex-1">
                  <p className="font-label-caps text-primary text-[11px] tracking-widest">SELECTED</p>
                  <p className="font-body-sm text-on-surface-variant mt-0.5">Avatar {AVATARS.indexOf(selectedAvatar) + 1}</p>
                </div>
                <div className="font-body-sm text-primary underline px-2">Change</div>
              </button>
            </div>

            {/* Name */}
            <div className="relative">
              <User className="absolute left-3 top-[33px] w-4 h-4 text-outline z-10 pointer-events-none" />
              <Input
                label="Hero Name"
                type="text"
                placeholder="Sir Budgetalot"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                error={errors.name}
                className="pl-9"
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-[33px] w-4 h-4 text-outline z-10 pointer-events-none" />
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
                className="pl-9"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-[33px] w-4 h-4 text-outline z-10 pointer-events-none" />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                error={errors.password}
                className="pl-9"
                autoComplete="new-password"
              />
            </div>

            {errors.form && <p className="font-body-sm text-error text-center">{errors.form}</p>}

            <div className="pt-1">
              <Button type="submit" variant="secondary" disabled={loading} className="w-full py-3 flex items-center justify-center gap-2 group">
                <UserPlus className="w-5 h-5 group-active:scale-90 transition-transform" />
                <span className="font-headline-sm uppercase tracking-wider">Begin Adventure</span>
              </Button>
            </div>

            {/* Pixel OR divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-0 border-t-4 border-dashed border-outline-variant" />
              <span className="font-label-caps text-[10px] tracking-widest text-outline uppercase">Or</span>
              <div className="flex-1 h-0 border-t-4 border-dashed border-outline-variant" />
            </div>

            <div>
              <GoogleSignInButton />
            </div>
          </form>

          {/* Footer decor */}
          <div className="px-6 pb-4 pt-0 flex justify-between items-center opacity-30">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 bg-primary border-2 border-black" />
              <div className="w-2.5 h-2.5 bg-secondary border-2 border-black" />
              <div className="w-2.5 h-2.5 bg-tertiary border-2 border-black" />
            </div>
            <p className="font-label-caps text-[9px] tracking-widest">REGISTER_V1</p>
          </div>
        </div>

        {/* Switch to signin */}
        <p className="text-center font-body-sm text-on-surface-variant">
          Already an adventurer?{' '}
          <a href="/signin" className="font-label-caps text-primary hover:underline uppercase tracking-wider">
            Sign In
          </a>
        </p>
      </div>

      <AvatarPickerModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} currentAvatar={selectedAvatar} onSelect={setSelectedAvatar} />
    </div>
  );
}
