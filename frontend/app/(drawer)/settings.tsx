import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeMode } from '@/theme/colors';

const PREFS_STORAGE_KEY = '@whatsapp_clone:user_settings_prefs';

interface UserSettingsPrefs {
  // Account
  securityNotifications: boolean;
  twoStepEnabled: boolean;
  // Privacy
  showOnlineStatus: boolean;
  readReceipts: boolean;
  lastSeenAudience: 'Everyone' | 'My Contacts' | 'Nobody';
  // Notifications
  conversationTones: boolean;
  messageNotifications: boolean;
  groupNotifications: boolean;
}

const DEFAULT_PREFS: UserSettingsPrefs = {
  securityNotifications: true,
  twoStepEnabled: false,
  showOnlineStatus: true,
  readReceipts: true,
  lastSeenAudience: 'Everyone',
  conversationTones: true,
  messageNotifications: true,
  groupNotifications: true,
};

const THEME_OPTIONS: {
  mode: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { mode: 'light', label: 'Light Mode', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark Mode', icon: 'moon-outline' },
  { mode: 'system', label: 'System Default', icon: 'phone-portrait-outline' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors, themeMode, setThemeMode } = useTheme();

  const [prefs, setPrefs] = useState<UserSettingsPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
        }
      })
      .catch(() => {});
  }, []);

  const updatePref = <K extends keyof UserSettingsPrefs>(
    key: K,
    value: UserSettingsPrefs[K]
  ) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next)).catch(
        () => {}
      );
      return next;
    });
  };

  const cycleLastSeenAudience = () => {
    const order: UserSettingsPrefs['lastSeenAudience'][] = [
      'Everyone',
      'My Contacts',
      'Nobody',
    ];
    const nextIdx = (order.indexOf(prefs.lastSeenAudience) + 1) % order.length;
    updatePref('lastSeenAudience', order[nextIdx]);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* 1. Profile Settings Card */}
      <Text style={[styles.sectionHeader, { color: colors.primary }]}>
        1. Profile Settings
      </Text>
      <TouchableOpacity
        style={[
          styles.profileCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => router.push('/(drawer)/profile')}
      >
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View
            style={[styles.avatarFallback, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.avatarLetter}>
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        <View style={styles.profileTextWrap}>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {user?.fullName}
          </Text>
          <Text
            style={[styles.profileAbout, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {user?.about}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
            {user?.email}
          </Text>
        </View>
        <Ionicons name="create-outline" size={22} color={colors.primary} />
      </TouchableOpacity>

      {/* 2. Theme Selection */}
      <Text style={[styles.sectionHeader, { color: colors.primary }]}>
        2. Theme Selection (Persisted)
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {THEME_OPTIONS.map((option, index) => {
          const selected = themeMode === option.mode;
          return (
            <TouchableOpacity
              key={option.mode}
              style={[
                styles.optionRow,
                index < THEME_OPTIONS.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={() => setThemeMode(option.mode)}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name={option.icon}
                  size={21}
                  color={selected ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.optionLabel,
                    {
                      color: colors.text,
                      fontWeight: selected ? '700' : '500',
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </View>
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={21}
                color={selected ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Account Settings */}
      <Text style={[styles.sectionHeader, { color: colors.primary }]}>
        3. Account Settings
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.optionRow,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="shield-checkmark-outline"
              size={21}
              color={colors.textSecondary}
            />
            <View>
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                Security Notifications
              </Text>
              <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                Show alerts when a contact&apos;s security code changes
              </Text>
            </View>
          </View>
          <Switch
            value={prefs.securityNotifications}
            onValueChange={(v) => updatePref('securityNotifications', v)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View
          style={[
            styles.optionRow,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="key-outline"
              size={21}
              color={colors.textSecondary}
            />
            <View>
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                Two-Step Verification
              </Text>
              <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                Extra PIN protection on registration
              </Text>
            </View>
          </View>
          <Switch
            value={prefs.twoStepEnabled}
            onValueChange={(v) => updatePref('twoStepEnabled', v)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <TouchableOpacity
          style={styles.optionRow}
          onPress={() =>
            Alert.alert(
              'Account Report',
              `Account ID: ${user?.id}\nEmail: ${user?.email}\nAuth Storage: Expo SecureStore (JWT)`
            )
          }
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="document-text-outline"
              size={21}
              color={colors.textSecondary}
            />
            <Text style={[styles.optionLabel, { color: colors.text }]}>
              Request Account Info
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* 4. Privacy Settings */}
      <Text style={[styles.sectionHeader, { color: colors.primary }]}>
        4. Privacy Settings
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.optionRow,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}
          onPress={cycleLastSeenAudience}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="eye-outline"
              size={21}
              color={colors.textSecondary}
            />
            <View>
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                Last Seen & Profile Photo
              </Text>
              <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                Tap to cycle visibility audience
              </Text>
            </View>
          </View>
          <Text style={[styles.valueBadge, { color: colors.primary }]}>
            {prefs.lastSeenAudience}
          </Text>
        </TouchableOpacity>

        <View
          style={[
            styles.optionRow,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="checkmark-done-outline"
              size={21}
              color={colors.tickRead}
            />
            <View>
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                Read Receipts
              </Text>
              <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                Send and receive blue double-check indicators
              </Text>
            </View>
          </View>
          <Switch
            value={prefs.readReceipts}
            onValueChange={(v) => updatePref('readReceipts', v)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Ionicons
              name="radio-button-on-outline"
              size={21}
              color={colors.online}
            />
            <View>
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                Show Online Status
              </Text>
              <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                Broadcast live presence via Socket.IO
              </Text>
            </View>
          </View>
          <Switch
            value={prefs.showOnlineStatus}
            onValueChange={(v) => updatePref('showOnlineStatus', v)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {/* 5. Notifications Settings */}
      <Text style={[styles.sectionHeader, { color: colors.primary }]}>
        5. Notifications
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.optionRow,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="musical-note-outline"
              size={21}
              color={colors.textSecondary}
            />
            <Text style={[styles.optionLabel, { color: colors.text }]}>
              Conversation Tones
            </Text>
          </View>
          <Switch
            value={prefs.conversationTones}
            onValueChange={(v) => updatePref('conversationTones', v)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View
          style={[
            styles.optionRow,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="notifications-outline"
              size={21}
              color={colors.textSecondary}
            />
            <Text style={[styles.optionLabel, { color: colors.text }]}>
              Direct Message Notifications
            </Text>
          </View>
          <Switch
            value={prefs.messageNotifications}
            onValueChange={(v) => updatePref('messageNotifications', v)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Ionicons
              name="people-outline"
              size={21}
              color={colors.textSecondary}
            />
            <Text style={[styles.optionLabel, { color: colors.text }]}>
              Group & Community Notifications
            </Text>
          </View>
          <Switch
            value={prefs.groupNotifications}
            onValueChange={(v) => updatePref('groupNotifications', v)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {/* 6. Logout */}
      <TouchableOpacity
        style={[
          styles.logoutCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={22} color={colors.danger} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>
          Log Out of WhatsApp
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginRight: 14,
  },
  avatarFallback: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  profileTextWrap: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
  },
  profileAbout: {
    fontSize: 13,
    marginTop: 2,
  },
  profileEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  optionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  valueBadge: {
    fontSize: 13,
    fontWeight: '700',
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
