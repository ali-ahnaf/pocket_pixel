// STUB: password change (no accounts offline, submit simulates success). No local data layer for this in packages/app yet, so it uses hardcoded stub data.
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ms } from 'react-native-size-matters';
import { AuthCard } from '../components/auth/AuthCard';
import { AuthScreen } from '../components/auth/AuthScreen';
import { stubRequest } from '../components/auth/stubRequest';
import { BackButton } from '../components/BackButton';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { color, font, space, text } from '../theme';

export default function ChangePasswordScreen() {
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

  const handleSubmit = async (): Promise<void> => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      await stubRequest();
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen centered={false}>
      <BackButton />
      <AuthCard title="Change Password" icon="Key">
        <Input
          label="Current Password"
          value={currentPassword}
          onChangeText={(value) => {
            setCurrentPassword(value);
            setError(null);
          }}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
        />

        <Input
          label="New Password"
          value={newPassword}
          onChangeText={(value) => {
            setNewPassword(value);
            setError(null);
          }}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <Input
          label="Confirm New Password"
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

        {success && <Text style={styles.success}>Password changed successfully</Text>}

        <Button label={loading ? 'Saving…' : 'Change Password'} size="lg" disabled={loading} onPress={handleSubmit} />
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  success: {
    fontFamily: font.mono,
    fontSize: ms(text.labelCaps.fontSize),
    lineHeight: ms(16),
    color: color.primary,
    textTransform: 'uppercase',
    borderWidth: ms(4),
    borderColor: color.border,
    backgroundColor: color.surface,
    padding: ms(space[3]),
  },
});
