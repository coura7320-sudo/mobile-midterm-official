import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversation, User } from '../types';
import { ThemeColors } from '../theme/colors';
import { formatChatTimestamp } from '../utils/formatTime';

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  onlineUserIds: string[];
  typingUserIds: string[];
  colors: ThemeColors;
  onPress: (
    conversation: Conversation,
    displayTitle: string,
    otherParticipant?: User
  ) => void;
  onLongPress?: (conversation: Conversation) => void;
}

export const ConversationItem = React.memo(function ConversationItem({
  conversation,
  currentUserId,
  onlineUserIds,
  typingUserIds,
  colors,
  onPress,
  onLongPress,
}: ConversationItemProps) {
  const otherParticipant =
    conversation.type === 'direct'
      ? conversation.participants?.find((p) => p.id !== currentUserId)
      : undefined;

  const displayTitle =
    conversation.type === 'group'
      ? conversation.name || 'Group Chat'
      : otherParticipant?.fullName || conversation.name || 'WhatsApp Contact';

  const avatarUri =
    conversation.type === 'group'
      ? conversation.avatarUrl
      : otherParticipant?.avatarUrl || conversation.avatarUrl;

  const isOnline =
    conversation.type === 'direct' && otherParticipant
      ? onlineUserIds.includes(otherParticipant.id) || otherParticipant.isOnline
      : false;

  const isTyping = typingUserIds.filter((id) => id !== currentUserId).length > 0;
  const unreadCount = conversation.unreadCount || 0;
  const formattedTime = formatChatTimestamp(
    conversation.lastMessageAt || conversation.updatedAt
  );

  return (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
      activeOpacity={0.75}
      onPress={() => onPress(conversation, displayTitle, otherParticipant)}
      onLongPress={() => onLongPress?.(conversation)}
    >
      <View style={styles.avatarContainer}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatarFallback,
              {
                backgroundColor:
                  conversation.type === 'group'
                    ? colors.primaryDark
                    : colors.primary,
              },
            ]}
          >
            {conversation.type === 'group' ? (
              <Ionicons name="people" size={22} color="#FFFFFF" />
            ) : (
              <Text style={styles.avatarInitial}>
                {displayTitle.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        )}
        {isOnline ? (
          <View
            style={[
              styles.onlineIndicator,
              { backgroundColor: colors.online, borderColor: colors.surface },
            ]}
          />
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {displayTitle}
          </Text>
          <Text
            style={[
              styles.timestamp,
              {
                color: unreadCount > 0 ? colors.accent : colors.textMuted,
                fontWeight: unreadCount > 0 ? '700' : '400',
              },
            ]}
          >
            {formattedTime}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          {isTyping ? (
            <Text
              style={[styles.typingText, { color: colors.accent }]}
              numberOfLines={1}
            >
              typing...
            </Text>
          ) : (
            <Text
              style={[
                styles.lastMessage,
                {
                  color:
                    unreadCount > 0 ? colors.text : colors.textSecondary,
                  fontWeight: unreadCount > 0 ? '600' : '400',
                },
              ]}
              numberOfLines={1}
            >
              {conversation.lastMessageText || 'Tap to start chatting'}
            </Text>
          )}

          {unreadCount > 0 ? (
            <View
              style={[
                styles.unreadBadge,
                { backgroundColor: colors.unreadBadge },
              ]}
            >
              <Text style={styles.unreadText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  typingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
