import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ApiClientError } from '@/services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordInputRef = useRef<TextInput>(null);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    setGeneralError(null);
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      });
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.errors) {
          setFieldErrors(err.errors);
        }
        setGeneralError(err.message);
      } else {
        setGeneralError(
          'Unable to connect to the server. Make sure the backend is running on port 4000.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoUser = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setFieldErrors({});
    setGeneralError(null);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerBlock}>
          <Text style={[styles.heading, { color: colors.text }]}>
            Enter your account credentials
          </Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>
            WhatsApp will verify your identity using JWT authentication.
          </Text>
        </View>

        {generalError ? (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: colors.danger + '18', borderColor: colors.danger },
            ]}
          >
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={[styles.errorBannerText, { color: colors.danger }]}>
              {generalError}
            </Text>
          </View>
        ) : null}

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Email Address
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: fieldErrors.email ? colors.danger : colors.border,
              },
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: '' }));
                }
              }}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
          </View>
          {fieldErrors.email ? (
            <Text style={[styles.fieldError, { color: colors.danger }]}>
              {fieldErrors.email}
            </Text>
          ) : null}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Password
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: fieldErrors.password ? colors.danger : colors.border,
              },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              ref={passwordInputRef}
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="done"
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: '' }));
                }
              }}
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
          {fieldErrors.password ? (
            <Text style={[styles.fieldError, { color: colors.danger }]}>
              {fieldErrors.password}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 },
          ]}
          disabled={isSubmitting}
          onPress={handleLogin}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>LOG IN</Text>
          )}
        </TouchableOpacity>

        <View
          style={[
            styles.demoBox,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.demoTitle, { color: colors.textSecondary }]}>
            Quick Demo Accounts (for two-user testing):
          </Text>
          <View style={styles.demoRow}>
            <TouchableOpacity
              style={[styles.demoChip, { borderColor: colors.primary }]}
              onPress={() => fillDemoUser('alice@example.com')}
            >
              <Text style={[styles.demoChipText, { color: colors.primary }]}>
                Fill Alice
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.demoChip, { borderColor: colors.primary }]}
              onPress={() => fillDemoUser('bob@example.com')}
            >
              <Text style={[styles.demoChipText, { color: colors.primary }]}>
                Fill Bob
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don&apos;t have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              Register now
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  headerBlock: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
  },
  subheading: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 18,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  fieldError: {
    marginTop: 5,
    fontSize: 12,
  },
  submitButton: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  demoBox: {
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  demoChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
