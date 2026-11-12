import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.container}>
        <View style={styles.topSection}>
          <Text style={[styles.title, { color: colors.primary }]}>
            Welcome to WhatsApp
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Simple. Reliable. Private real-time messaging across Android & iOS.
          </Text>
        </View>

        <View
          style={[
            styles.illustrationCircle,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="logo-whatsapp"
            size={104}
            color={colors.accent}
          />
          <View style={styles.featurePills}>
            <View style={[styles.pill, { backgroundColor: colors.surface }]}>
              <Ionicons name="lock-closed" size={14} color={colors.primary} />
              <Text style={[styles.pillText, { color: colors.text }]}>
                JWT Secured
              </Text>
            </View>
            <View style={[styles.pill, { backgroundColor: colors.surface }]}>
              <Ionicons name="flash" size={14} color={colors.accent} />
              <Text style={[styles.pillText, { color: colors.text }]}>
                Socket.IO Live
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Text style={[styles.termsText, { color: colors.textMuted }]}>
            Read our Privacy Policy. Tap &ldquo;Agree and Continue&rdquo; to
            accept the Terms of Service and create an account, or sign in to an
            existing account.
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.primaryButtonText}>AGREE AND CONTINUE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: colors.primary },
            ]}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
              ALREADY HAVE AN ACCOUNT? LOG IN
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 32,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  illustrationCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featurePills: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
