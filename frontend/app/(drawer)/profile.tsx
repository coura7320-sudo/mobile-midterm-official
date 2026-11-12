import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const ABOUT_PRESETS = [
  'Hey there! I am using WhatsApp.',
  'Available',
  'Busy',
  'At Computer Engineering lecture',
  'Coding React Native & Socket.IO',
  'In a meeting',
];

const AVATAR_COLORS = ['128C7E', '075E54', '2B6CB0', '6B46C1', 'C53030', 'D97706'];

export default function ProfileScreen() {
  const { user, updateProfile } = useAuth();
  const { colors } = useTheme();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [about, setAbout] = useState(
    user?.about || 'Hey there! I am using WhatsApp.'
  );
  const [avatarBg, setAvatarBg] = useState('128C7E');
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const previewAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    fullName.trim() || user?.fullName || 'User'
  )}&background=${avatarBg}&color=fff&bold=true`;

  const handleSave = async () => {
    if (!fullName.trim()) return;
    setIsSaving(true);
    setSavedNotice(false);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        about: about.trim(),
        avatarUrl: previewAvatarUrl,
      });
      setSavedNotice(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: previewAvatarUrl }} style={styles.avatar} />
      </View>

      <View style={styles.colorSwatchesRow}>
        {AVATAR_COLORS.map((hex) => (
          <TouchableOpacity
            key={hex}
            style={[
              styles.colorSwatch,
              {
                backgroundColor: `#${hex}`,
                borderColor:
                  avatarBg === hex ? colors.text : 'transparent',
              },
            ]}
            onPress={() => setAvatarBg(hex)}
          />
        ))}
      </View>

      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.label, { color: colors.primary }]}>Name</Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderBottomColor: colors.border },
          ]}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your full name"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={[styles.helperText, { color: colors.textMuted }]}>
          This name will be visible to your WhatsApp contacts and persisted in
          users.json.
        </Text>

        <Text style={[styles.label, { color: colors.primary, marginTop: 20 }]}>
          About
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderBottomColor: colors.border },
          ]}
          value={about}
          onChangeText={setAbout}
          placeholder="Available"
          placeholderTextColor={colors.textMuted}
        />

        <View style={styles.presetsWrap}>
          {ABOUT_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[
                styles.presetChip,
                {
                  backgroundColor:
                    about === preset
                      ? colors.primary + '22'
                      : colors.surfaceSecondary,
                  borderColor:
                    about === preset ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setAbout(preset)}
            >
              <Text
                style={[
                  styles.presetText,
                  {
                    color:
                      about === preset ? colors.primary : colors.textSecondary,
                  },
                ]}
              >
                {preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.primary, marginTop: 20 }]}>
          Email
        </Text>
        <Text style={[styles.readonlyValue, { color: colors.textSecondary }]}>
          {user?.email}
        </Text>

        {savedNotice ? (
          <View style={styles.savedRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
            <Text style={[styles.savedText, { color: colors.accent }]}>
              Profile updated & persisted to backend!
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>SAVE PROFILE</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  colorSwatchesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
  },
  sectionCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '500',
  },
  readonlyValue: {
    fontSize: 15,
    paddingVertical: 8,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  savedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 22,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
