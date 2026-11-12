import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat } from '@/contexts/ChatContext';
import { formatChatTimestamp } from '@/utils/formatTime';

export default function StarredMessagesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { starredMessages, loadStarredMessages } = useChat();

  useEffect(() => {
    loadStarredMessages().catch(() => {});
  }, [loadStarredMessages]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={starredMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() =>
              router.push({
                pathname: '/chat/[id]',
                params: { id: item.conversationId },
              })
            }
          >
            <View style={styles.cardHeader}>
              <View style={styles.starRow}>
                <Ionicons name="star" size={15} color="#F59E0B" />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  Starred Message
                </Text>
              </View>
              <Text style={[styles.dateText, { color: colors.textMuted }]}>
                {formatChatTimestamp(item.createdAt)}
              </Text>
            </View>
            <Text style={[styles.messageText, { color: colors.text }]}>
              {item.text}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="star-outline" size={60} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>
              No Starred Messages Yet
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Long-press any message bubble inside a conversation to star it for quick reference.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  emptyWrap: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  title: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
