import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientButton from '@components/ui/GradientButton';
import { useAuth } from '@hooks/useAuth';
import { useAuthStore } from '@store/authStore';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from '@domain/auth/validation';
import { palette, gradients } from '@/theme/colors';
import { radii, spacing, shadows } from '@/theme/spacing';
import { fontFamilies, fontSize, fontWeight, textStyles } from '@/theme/typography';
import type { RegisterScreenProps } from '@navigation/types';

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const { signUp } = useAuth();
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);

  const handleRegister = async () => {
    setSubmitted(true);

    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);
    const confirmResult = validatePasswordMatch(password, confirmPassword);

    setEmailError(emailResult.valid ? null : emailResult.error);
    setPasswordError(passwordResult.valid ? null : passwordResult.error);
    setConfirmError(confirmResult.valid ? null : confirmResult.error);

    if (!emailResult.valid || !passwordResult.valid || !confirmResult.valid) return;

    await signUp(email.trim(), password);
    // SR-15: Clear passwords from memory after submission
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <LinearGradient colors={gradients.heroWash} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inner}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back */}
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={palette.purple900} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.emoji}>✨</Text>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>
                Start your couple journey together
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email */}
              <View style={styles.fieldGroup}>
                <View style={[styles.inputWrap, emailFocused && styles.inputFocused, submitted && emailError && styles.inputError]}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={emailFocused ? palette.pink500 : palette.gray400}
                  />
                  <TextInput
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (submitted) {
                        const result = validateEmail(text);
                        setEmailError(result.valid ? null : result.error);
                      }
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder="Email address"
                    placeholderTextColor={palette.gray400}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    style={styles.input}
                  />
                </View>
                {submitted && emailError && (
                  <Text style={styles.errorText}>{emailError}</Text>
                )}
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <View style={[styles.inputWrap, passwordFocused && styles.inputFocused, submitted && passwordError && styles.inputError]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={passwordFocused ? palette.pink500 : palette.gray400}
                  />
                  <TextInput
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (submitted) {
                        const result = validatePassword(text);
                        setPasswordError(result.valid ? null : result.error);
                      }
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    placeholder="Password"
                    placeholderTextColor={palette.gray400}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="next"
                    style={styles.input}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={palette.gray400}
                    />
                  </TouchableOpacity>
                </View>
                {submitted && passwordError && (
                  <Text style={styles.errorText}>{passwordError}</Text>
                )}
              </View>

              {/* Confirm password */}
              <View style={styles.fieldGroup}>
                <View style={[styles.inputWrap, confirmFocused && styles.inputFocused, submitted && confirmError && styles.inputError]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={confirmFocused ? palette.pink500 : palette.gray400}
                  />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (submitted) {
                        const result = validatePasswordMatch(password, text);
                        setConfirmError(result.valid ? null : result.error);
                      }
                    }}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                    placeholder="Confirm password"
                    placeholderTextColor={palette.gray400}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="done"
                    onSubmitEditing={() => { void handleRegister(); }}
                    style={styles.input}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirm((prev) => !prev)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={palette.gray400}
                    />
                  </TouchableOpacity>
                </View>
                {submitted && confirmError && (
                  <Text style={styles.errorText}>{confirmError}</Text>
                )}
              </View>
            </View>

            {/* General error banner */}
            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={palette.error} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* CTA */}
            <GradientButton
              label="Create Account"
              onPress={() => { void handleRegister(); }}
              size="lg"
              fullWidth
              loading={isLoading}
            />

            {/* Login link */}
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.linkText}>
                Already have an account?{' '}
              </Text>
              <Text style={styles.linkTextBold}>Log in</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  inner: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing['5'],
    paddingBottom: spacing['8'],
    gap: spacing['6'],
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing['2'],
  },
  header: {
    gap: spacing['3'],
    alignItems: 'center',
    marginTop: spacing['4'],
  },
  emoji: { fontSize: 48 },
  title: {
    ...textStyles.displaySm,
    color: palette.purple900,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.bodyMd,
    color: palette.gray500,
    textAlign: 'center',
    maxWidth: 280,
  },
  form: {
    gap: spacing['4'],
  },
  fieldGroup: {
    gap: spacing['1'],
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radii.xl,
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    borderWidth: 1.5,
    borderColor: palette.gray200,
    gap: spacing['3'],
    ...shadows.sm,
  },
  inputFocused: {
    borderColor: palette.pink400,
    ...shadows.md,
  },
  inputError: {
    borderColor: palette.error,
  },
  input: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.md,
    color: palette.purple900,
    fontWeight: fontWeight.medium,
  },
  errorText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.xs,
    color: palette.error,
    paddingLeft: spacing['4'],
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.errorBg,
    borderRadius: radii.lg,
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    gap: spacing['2'],
  },
  errorBannerText: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.sm,
    color: palette.error,
    fontWeight: fontWeight.medium,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2'],
  },
  linkText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.sm,
    color: palette.gray500,
  },
  linkTextBold: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.sm,
    color: palette.pink500,
    fontWeight: fontWeight.semibold,
  },
});
