import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat } from '@/contexts/ChatContext';
import { getBackendBaseUrl } from '@/services/api';
import { socketService } from '@/services/socketService';

export default function HelpScreen() {
  const { colors, themeMode } = useTheme();
  const { isOffline, lastSyncedAt, conversations } = useChat();

  const isSocketConnected = socketService.isConnected();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View
        style={[
          styles.heroCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Ionicons name="logo-whatsapp" size={56} color={colors.accent} />
        <Text style={[styles.title, { color: colors.text }]}>
          WhatsApp Mobile Clone
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Version 1.0.0 • Computer Engineering Mobile Development Project
        </Text>
      </View>

      <Text style={[styles.sectionHeader, { color: colors.primary }]}>
        Live System Diagnostics
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={[styles.diagRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.diagLabel, { color: colors.textSecondary }]}>
            Backend API Endpoint
          </Text>
          <Text style={[styles.diagValue, { color: colors.text }]}>
            {getBackendBaseUrl()}
          </Text>
        </View>

        <View style={[styles.diagRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.diagLabel, { color: colors.textSecondary }]}>
            Socket.IO Real-Time Link
          </Text>
          <Text
            style={[
              styles.diagValue,
              { color: isSocketConnected ? colors.online : colors.danger },
            ]}
          >
            {isSocketConnected ? 'Connected (Live)' : 'Disconnected'}
          </Text>
        </View>

        <View style={[styles.diagRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.diagLabel, { color: colors.textSecondary }]}>
            SQLite Sync Status
          </Text>
          <Text style={[styles.diagValue, { color: colors.text }]}>
            {isOffline
              ? 'Offline (Local SQLite Active)'
              : `${conversations.length} chats synced`}
          </Text>
        </View>

        <View style={styles.diagRowNoBorder}>
          <Text style={[styles.diagLabel, { color: colors.textSecondary }]}>
            Active Theme Mode
          </Text>
          <Text style={[styles.diagValue, { color: colors.primary }]}>
            {themeMode.toUpperCase()}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  heroCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  diagRowNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  diagLabel: {
    fontSize: 14,
  },
  diagValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});
