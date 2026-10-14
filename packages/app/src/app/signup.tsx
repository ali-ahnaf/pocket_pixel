// STUB: sign up (no accounts offline, submit simulates success and the chosen avatar is not saved). No local data layer for this in packages/app yet, so it uses hardcoded stub data.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { AuthCard } from '../components/auth/AuthCard';
import { AuthLogo } from '../components/auth/AuthLogo';
import { AuthScreen } from '../components/auth/AuthScreen';
import { AuthSwitchLink } from '../components/auth/AuthSwitchLink';
import { stubRequest } from '../components/auth/stubRequest';
import { AvatarPickerModal } from '../components/AvatarPickerModal';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AVATARS, avatarSource } from '../lib/static';
import { color, font, shadow, space, text } from '../theme';

interface SignUpErrors {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
}

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = (): SignUpErrors => {
    const next: SignUpErrors = {};
    if (!name.trim()) next.name = 'Required';
    if (!email) next.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Invalid email';
    if (!password) next.password = 'Required';
    else if (password.length < 8) next.password = 'Min 8 characters';
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
      // Web also sets up the AI encryption key (DEK) here; dropped, the offline app has no accounts.
      await stubRequest();
      router.replace('/');
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <AuthLogo />

      <AuthCard title="Create Hero" glyph="+" tone="secondary" footerTag="REGISTER_V1">
        <View style={styles.avatarSection}>
          <Text style={styles.label}>Choose Avatar</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Avatar ${AVATARS.indexOf(selectedAvatar) + 1} selected. Change avatar`}
            onPress={() => setIsAvatarModalOpen(true)}
            style={({ pressed }) => [styles.avatarButton, pressed && styles.avatarButtonPressed]}
          >
            <View style={styles.avatarFrame}>
              <Image source={avatarSource(selectedAvatar)} style={styles.avatarImage} accessibilityIgnoresInvertColors />
            </View>
            <View style={styles.avatarText}>
              <Text style={styles.selectedLabel}>SELECTED</Text>
              <Text style={styles.avatarName}>Avatar {AVATARS.indexOf(selectedAvatar) + 1}</Text>
            </View>
            <Text style={styles.changeText}>Change</Text>
          </Pressable>
        </View>

        <Input
          label="Hero Name"
          placeholder="Sir Budgetalot"
          value={name}
          onChangeText={(value) => {
            setName(value);
            setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          error={errors.name}
          autoComplete="name"
          textContentType="name"
        />

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

        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />

        {errors.form && <Text style={styles.formError}>{errors.form}</Text>}

        <Button label="Begin Adventure" variant="secondary" size="lg" disabled={loading} onPress={handleSubmit} />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>
      </AuthCard>

      <AuthSwitchLink inline prompt="Already an adventurer?" label="Sign In" onPress={() => router.replace('/signin')} />

      {isAvatarModalOpen && <AvatarPickerModal currentAvatar={selectedAvatar} onSelect={setSelectedAvatar} onClose={() => setIsAvatarModalOpen(false)} />}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  avatarSection: { gap: ms(space[2]) },
  label: {
    fontFamily: font.mono,
    fontSize: ms(text.labelCaps.fontSize),
    lineHeight: ms(text.labelCaps.lineHeight),
    color: color.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(space[4]),
    padding: ms(space[3]),
    backgroundColor: color.surface,
    borderWidth: ms(4),
    borderColor: color.border,
    boxShadow: shadow.card,
  },
  avatarButtonPressed: { backgroundColor: color.surfaceHigh },
  avatarFrame: { width: ms(56), height: ms(56), borderWidth: ms(4), borderColor: color.primary, overflow: 'hidden', boxShadow: shadow.coin },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { flex: 1 },
  selectedLabel: { fontFamily: font.mono, fontSize: ms(11), color: color.primary, letterSpacing: 2 },
  avatarName: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurfaceVariant, marginTop: ms(2) },
  changeText: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), color: color.primary, textDecorationLine: 'underline', paddingHorizontal: ms(space[2]) },
  formError: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.error, textAlign: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: ms(space[3]), paddingVertical: ms(space[1]) },
  // Uniform border on a zero-height view: iOS ignores dashed style on a single side.
  dividerLine: { flex: 1, height: 0, borderWidth: ms(2), borderStyle: 'dashed', borderColor: color.outlineVariant },
  dividerText: { fontFamily: font.mono, fontSize: ms(10), color: color.outline, letterSpacing: 2, textTransform: 'uppercase' },
});
