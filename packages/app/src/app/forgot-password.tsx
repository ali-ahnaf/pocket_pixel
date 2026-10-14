import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ms } from 'react-native-size-matters';
import { AuthCard } from '../components/auth/AuthCard';
import { AuthScreen } from '../components/auth/AuthScreen';
import { BackButton } from '../components/BackButton';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AppError } from '../errors/app-error';
import { useAuth } from '../hooks/AuthProvider';
import { color, font, text } from '../theme';

interface ForgotPasswordErrors {
  email?: string;
  password?: string;
  form?: string;
}

// No email is sent offline, so this resets the password on the device without verifying the caller.
export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const validate = (): ForgotPasswordErrors => {
    const next: ForgotPasswordErrors = {};
    if (!email) next.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Invalid email';
    if (!password) next.password = 'Required';
    else if (password.length < 8) next.password = 'Min 8 characters';
    else if (password !== confirmPassword) next.password = 'Passwords do not match';
    return next;
  };

  const handleSubmit = async (): Promise<void> => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setMessage('');
    setLoading(true);
    try {
      await resetPassword(email, password);
      setMessage('Password updated. You can sign in now.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrors({ form: err instanceof AppError ? err.message : 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <AuthCard title="Reset Password" icon="Lock">
        <Input
          label="Email Address"
          placeholder="hero@guild.com"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setErrors((prev) => ({ ...prev, email: undefined, form: undefined }));
          }}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />

        <Input
          label="New Password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setErrors((prev) => ({ ...prev, password: undefined }));
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
            setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />

        {!!errors.form && <Text style={styles.formError}>{errors.form}</Text>}
        {!!message && <Text style={styles.message}>{message}</Text>}

        <Button label="Reset Password" size="lg" disabled={loading} onPress={handleSubmit} />

        <BackButton href="/signin" label="Back to Login" variant="subtle" />
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  message: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.primary, textAlign: 'center' },
  formError: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.error, textAlign: 'center' },
});
