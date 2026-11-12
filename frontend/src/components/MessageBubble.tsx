import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../types';
import { ThemeColors } from '../theme/colors';
import { formatMessageTime } from '../utils/formatTime';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  senderName?: string;
  showSenderName?: boolean;
  isStarred: boolean;
  colors: ThemeColors;
  onLongPress?: (message: Message) => void;
}

export const MessageBubble = React.memo(function MessageBubble({
  message,
  isOwnMessage,
  senderName,
  showSenderName,
  isStarred,
  colors,
  onLongPress,
}: MessageBubbleProps) {
  const renderStatusIcon = () => {
    if (!isOwnMessage) return null;

    if (message.status === 'read') {
      return (
        <Ionicons
          name="checkmark-done"
          size={16}
          color={colors.tickRead}
          style={styles.tickIcon}
        />
      );
    }

    if (message.status === 'delivered') {
      return (
        <Ionicons
          name="checkmark-done"
          size={16}
          color={colors.tickDefault}
          style={styles.tickIcon}
        />
      );
    }

    return (
      <Ionicons
        name="checkmark"
        size={15}
        color={colors.tickDefault}
        style={styles.tickIcon}
      />
    );
  };

  return (
    <View
      style={[
        styles.wrapper,
        isOwnMessage ? styles.wrapperSent : styles.wrapperReceived,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={() => onLongPress?.(message)}
        style={[
          styles.bubble,
          isOwnMessage
            ? [
                styles.bubbleSent,
                { backgroundColor: colors.sentBubble },
              ]
            : [
                styles.bubbleReceived,
                { backgroundColor: colors.receivedBubble },
              ],
        ]}
      >
        {showSenderName && !isOwnMessage && senderName ? (
          <Text style={[styles.senderName, { color: colors.primary }]}>
            {senderName}
          </Text>
        ) : null}

        <Text
          style={[
            styles.messageText,
            {
              color: isOwnMessage
                ? colors.sentBubbleText
                : colors.receivedBubbleText,
            },
          ]}
        >
          {message.text}
        </Text>

        <View style={styles.metaRow}>
          {isStarred ? (
            <Ionicons
              name="star"
              size={11}
              color={colors.textMuted}
              style={styles.starIcon}
            />
          ) : null}
          <Text style={[styles.timeText, { color: colors.textMuted }]}>
            {formatMessageTime(message.createdAt)}
          </Text>
          {renderStatusIcon()}
        </View>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 3,
    paddingHorizontal: 12,
    flexDirection: 'row',
  },
  wrapperSent: {
    justifyContent: 'flex-end',
  },
  wrapperReceived: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1,
  },
  bubbleSent: {
    borderTopRightRadius: 3,
  },
  bubbleReceived: {
    borderTopLeftRadius: 3,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
  },
  starIcon: {
    marginRight: 4,
  },
  timeText: {
    fontSize: 11,
  },
  tickIcon: {
    marginLeft: 4,
  },
});
