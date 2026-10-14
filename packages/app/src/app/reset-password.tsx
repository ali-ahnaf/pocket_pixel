// STUB: password reset (submit simulates success, like the web mock). No local data layer for this in packages/app yet, so it uses hardcoded stub data.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { AuthCard } from '../components/auth/AuthCard';
import { AuthScreen } from '../components/auth/AuthScreen';
import { stubRequest } from '../components/auth/stubRequest';
import { BackButton } from '../components/BackButton';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!password) return 'Password required';
    if (password.length < 6) return 'Min 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (): Promise<void> => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await stubRequest();
      router.push('/signin');
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <BackButton />
      <AuthCard title="Reset Password" icon="Lock">
        <Input
          label="New Password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError(null);
          }}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <Input
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            setError(null);
          }}
          error={error ?? undefined}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <Button label="Reset Password" size="lg" disabled={loading} onPress={handleSubmit} />
      </AuthCard>
    </AuthScreen>
  );
}
