import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat } from '@/contexts/ChatContext';
import { apiRequest } from '@/services/api';
import { User } from '@/types';

export default function ContactProfileScreen() {
  const { id, name, email } = useLocalSearchParams<{
    id: string;
    name?: string;
    email?: string;
  }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { startDirectConversation, onlineUserIds } = useChat();

  const [contact, setContact] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!id) {
      setLoading(false);
      return;
    }
    apiRequest<{ success: boolean; user: User }>(`/api/users/${id}`)
      .then((res) => {
        if (isMounted) {
          setContact(res.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const displayName = contact?.fullName || name || 'Contact Profile';
  const displayEmail = contact?.email || email || 'N/A';
  const displayAbout = contact?.about || 'Hey there! I am using WhatsApp.';
  const isOnline =
    (id && onlineUserIds.includes(id)) || Boolean(contact?.isOnline);

  const handleMessageContact = async () => {
    if (!id) return;
    const conv = await startDirectConversation(id);
    router.replace({
      pathname: '/chat/[id]',
      params: {
        id: conv.id,
        name: displayName,
        contactId: id,
        avatarUrl: contact?.avatarUrl || '',
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Contact Info' }} />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {contact?.avatarUrl ? (
            <Image source={{ uri: contact.avatarUrl }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatarFallback,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.avatarLetter}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <Text style={[styles.name, { color: colors.text }]}>
            {displayName}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>
            {displayEmail}
          </Text>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isOnline
                  ? colors.online + '20'
                  : colors.surfaceSecondary,
              },
            ]}
          >
            <Ionicons
              name="ellipse"
              size={10}
              color={isOnline ? colors.online : colors.textMuted}
            />
            <Text
              style={[
                styles.statusText,
                { color: isOnline ? colors.online : colors.textMuted },
              ]}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[
                styles.actionBox,
                { backgroundColor: colors.surfaceSecondary },
              ]}
              onPress={handleMessageContact}
            >
              <Ionicons name="chatbubble-ellipses" size={22} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.primary }]}>
                Message
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBox,
                { backgroundColor: colors.surfaceSecondary },
              ]}
              onPress={() =>
                Alert.alert(
                  'Simulated Audio Call',
                  `Calling ${displayName} (Simulated Voice Call)...`
                )
              }
            >
              <Ionicons name="call" size={22} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.primary }]}>
                Audio
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBox,
                { backgroundColor: colors.surfaceSecondary },
              ]}
              onPress={() =>
                Alert.alert(
                  'Simulated Video Call',
                  `Video calling ${displayName} (Simulated Video Call)...`
                )
              }
            >
              <Ionicons name="videocam" size={22} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.primary }]}>
                Video
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.aboutBox,
              { borderTopColor: colors.border },
            ]}
          >
            <Text style={[styles.aboutLabel, { color: colors.primary }]}>
              About
            </Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>
              {displayAbout}
            </Text>
            <Text style={[styles.paramMeta, { color: colors.textMuted }]}>
              Contact UUID: {id}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 14,
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '700',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 20,
  },
  actionBox: {
    width: 82,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  aboutBox: {
    width: '100%',
    borderTopWidth: 1,
    marginTop: 20,
    paddingTop: 16,
  },
  aboutLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  aboutValue: {
    fontSize: 15,
    marginTop: 6,
  },
  paramMeta: {
    fontSize: 11,
    marginTop: 12,
  },
});
