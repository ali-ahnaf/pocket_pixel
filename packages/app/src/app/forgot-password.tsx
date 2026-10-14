// STUB: password reset email (submit simulates success, like the web mock). No local data layer for this in packages/app yet, so it uses hardcoded stub data.
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ms } from 'react-native-size-matters';
import { AuthCard } from '../components/auth/AuthCard';
import { AuthScreen } from '../components/auth/AuthScreen';
import { stubRequest } from '../components/auth/stubRequest';
import { BackButton } from '../components/BackButton';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { color, font, text } from '../theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!email) return 'Required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Invalid email';
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
      setMessage('Reset link sent to your email!');
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <AuthCard title="Forgot Password" icon="Mail">
        <Input
          label="Email Address"
          placeholder="hero@guild.com"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError(null);
          }}
          error={error ?? undefined}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />

        {!!message && <Text style={styles.message}>{message}</Text>}

        <Button label="Send Reset Link" size="lg" disabled={loading} onPress={handleSubmit} />

        <BackButton href="/signin" label="Back to Login" variant="subtle" />
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  message: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.primary, textAlign: 'center' },
});
