import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat } from '@/contexts/ChatContext';
import { ConversationItem } from '@/components/ConversationItem';
import { Conversation, User } from '@/types';

export default function ArchivedChatsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const {
    conversations,
    onlineUserIds,
    typingByConversation,
    toggleArchiveConversation,
  } = useChat();

  const currentUserId = user?.id || '';

  const archivedList = useMemo(() => {
    return conversations.filter((c) =>
      (c.archivedBy ?? []).includes(currentUserId)
    );
  }, [conversations, currentUserId]);

  const handleOpen = (
    conv: Conversation,
    displayTitle: string,
    otherParticipant?: User
  ) => {
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: conv.id,
        name: displayTitle,
        contactId: otherParticipant?.id || '',
      },
    });
  };

  const handleUnarchive = (conv: Conversation) => {
    Alert.alert(
      'Unarchive Conversation',
      'Return this conversation to your main Chats list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unarchive',
          onPress: () => toggleArchiveConversation(conv.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={archivedList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            currentUserId={currentUserId}
            onlineUserIds={onlineUserIds}
            typingUserIds={typingByConversation[item.id] || []}
            colors={colors}
            onPress={handleOpen}
            onLongPress={handleUnarchive}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons
              name="archive-outline"
              size={60}
              color={colors.primary}
            />
            <Text style={[styles.title, { color: colors.text }]}>
              No Archived Chats
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Long-press any conversation in your Chats tab to archive or unarchive it.
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
