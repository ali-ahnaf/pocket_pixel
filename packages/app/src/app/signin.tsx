import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { AuthCard } from '../components/auth/AuthCard';
import { AuthLogo } from '../components/auth/AuthLogo';
import { AuthScreen } from '../components/auth/AuthScreen';
import { AuthSwitchLink } from '../components/auth/AuthSwitchLink';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AppError } from '../errors/app-error';
import { useAuth } from '../hooks/AuthProvider';
import { color, font, space, text } from '../theme';

interface SignInErrors {
  email?: string;
  password?: string;
  form?: string;
}

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<SignInErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = (): SignInErrors => {
    const next: SignInErrors = {};
    if (!email) next.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Invalid email';
    if (!password) next.password = 'Required';
    return next;
  };

  const handleSubmit = async (): Promise<void> => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      // Signing in flips the root layout's route guard, which moves the user into the app.
      await signIn({ email, password });
    } catch (err) {
      setErrors({ form: err instanceof AppError ? err.message : 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <AuthLogo />

      <AuthCard title="Player Login" icon="ArrowRight" footerTag="AUTH_V1">
        <Input
          label="Email Address"
          placeholder="hero@guild.com"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />

        <View>
          <View style={styles.passwordRow}>
            <Text style={styles.passwordLabel}>Password</Text>
            <Pressable accessibilityRole="link" accessibilityLabel="Forgot Password?" hitSlop={12} onPress={() => router.push('/forgot-password')}>
              {({ pressed }) => <Text style={[styles.forgotLink, pressed && styles.linkPressed]}>Forgot Password?</Text>}
            </Pressable>
          </View>
          <Input
            accessibilityLabel="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
          />
        </View>

        {errors.form && <Text style={styles.formError}>{errors.form}</Text>}

        <Button label="Enter the World" size="lg" disabled={loading} onPress={handleSubmit} />
      </AuthCard>

      <AuthSwitchLink prompt="New adventurer?" label="Create Account" onPress={() => router.replace('/signup')} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  passwordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: ms(space[1]) },
  passwordLabel: {
    fontFamily: font.mono,
    fontSize: ms(text.labelCaps.fontSize),
    lineHeight: ms(text.labelCaps.lineHeight),
    color: color.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  forgotLink: { fontFamily: font.mono, fontSize: ms(11), color: color.outline },
  linkPressed: { color: color.primary, textDecorationLine: 'underline' },
  formError: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.error, textAlign: 'center' },
});
