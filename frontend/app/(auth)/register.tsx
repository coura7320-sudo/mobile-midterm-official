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

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors } = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    }
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      errors.email = 'Please provide a valid email address.';
    }
    if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    setGeneralError(null);
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
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
            Create your WhatsApp profile
          </Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>
            Enter your full name, email, and a strong password to get started.
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
            Full Name
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: fieldErrors.fullName ? colors.danger : colors.border,
              },
            ]}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g. Sarah Connor"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              returnKeyType="next"
              value={fullName}
              onChangeText={(val) => {
                setFullName(val);
                if (fieldErrors.fullName) {
                  setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                }
              }}
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          </View>
          {fieldErrors.fullName ? (
            <Text style={[styles.fieldError, { color: colors.danger }]}>
              {fieldErrors.fullName}
            </Text>
          ) : null}
        </View>

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
              ref={emailRef}
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
              onSubmitEditing={() => passwordRef.current?.focus()}
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
              ref={passwordRef}
              style={[styles.input, { color: colors.text }]}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="next"
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: '' }));
                }
              }}
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
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

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Confirm Password
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: fieldErrors.confirmPassword
                  ? colors.danger
                  : colors.border,
              },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              ref={confirmPasswordRef}
              style={[styles.input, { color: colors.text }]}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="done"
              value={confirmPassword}
              onChangeText={(val) => {
                setConfirmPassword(val);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }
              }}
              onSubmitEditing={handleRegister}
            />
          </View>
          {fieldErrors.confirmPassword ? (
            <Text style={[styles.fieldError, { color: colors.danger }]}>
              {fieldErrors.confirmPassword}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 },
          ]}
          disabled={isSubmitting}
          onPress={handleRegister}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>CREATE ACCOUNT</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              Log in
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
    marginBottom: 22,
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
    marginBottom: 16,
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
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 26,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
