import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat } from '@/contexts/ChatContext';
import { MessageBubble } from '@/components/MessageBubble';
import { Message } from '@/types';
import { formatLastSeen } from '@/utils/formatTime';

export default function IndividualChatScreen() {
  const { id, name, contactId, avatarUrl } = useLocalSearchParams<{
    id: string;
    name?: string;
    contactId?: string;
    avatarUrl?: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const {
    conversations,
    messagesByConversation,
    onlineUserIds,
    typingByConversation,
    loadConversationMessages,
    sendMessage,
    toggleStarMessage,
    joinConversationRoom,
    leaveConversationRoom,
    emitTypingStart,
    emitTypingStop,
    markConversationRead,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const flatListRef = useRef<FlatList<Message>>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCurrentlyTypingRef = useRef(false);

  const currentUserId = user?.id || '';
  const conversationId = id || '';

  const conversation = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId]
  );

  const otherParticipant = useMemo(() => {
    if (!conversation || conversation.type !== 'direct') return undefined;
    return conversation.participants?.find((p) => p.id !== currentUserId);
  }, [conversation, currentUserId]);

  const messages = useMemo(
    () => messagesByConversation[conversationId] || [],
    [messagesByConversation, conversationId]
  );

  const isOtherOnline = useMemo(() => {
    const targetId = otherParticipant?.id || contactId;
    if (!targetId) return false;
    return (
      onlineUserIds.includes(targetId) || Boolean(otherParticipant?.isOnline)
    );
  }, [otherParticipant, contactId, onlineUserIds]);

  const typingUsers = useMemo(() => {
    const list = typingByConversation[conversationId] || [];
    return list.filter((uid) => uid !== currentUserId);
  }, [typingByConversation, conversationId, currentUserId]);

  const isTyping = typingUsers.length > 0;

  // Join Socket.IO conversation room & fetch initial history via REST
  useEffect(() => {
    if (!conversationId) return;
    joinConversationRoom(conversationId);
    loadConversationMessages(conversationId).catch(() => {});

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isCurrentlyTypingRef.current) {
        emitTypingStop(conversationId);
        isCurrentlyTypingRef.current = false;
      }
      leaveConversationRoom(conversationId);
    };
  }, [
    conversationId,
    joinConversationRoom,
    leaveConversationRoom,
    loadConversationMessages,
    emitTypingStop,
  ]);

  // Auto-scroll and mark incoming messages read while chat screen is open
  useEffect(() => {
    if (messages.length > 0) {
      markConversationRead(conversationId);
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [messages.length, conversationId, markConversationRead]);

  const handleChangeText = useCallback(
    (text: string) => {
      setInputText(text);
      if (!conversationId) return;

      if (text.trim().length > 0) {
        if (!isCurrentlyTypingRef.current) {
          isCurrentlyTypingRef.current = true;
          emitTypingStart(conversationId);
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          isCurrentlyTypingRef.current = false;
          emitTypingStop(conversationId);
        }, 1800);
      } else if (isCurrentlyTypingRef.current) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        isCurrentlyTypingRef.current = false;
        emitTypingStop(conversationId);
      }
    },
    [conversationId, emitTypingStart, emitTypingStop]
  );

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !conversationId || isSending) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isCurrentlyTypingRef.current) {
      isCurrentlyTypingRef.current = false;
      emitTypingStop(conversationId);
    }

    setInputText('');
    setIsSending(true);
    try {
      await sendMessage(conversationId, trimmed);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 60);
    } catch {
      setInputText(trimmed);
      Alert.alert('Delivery Error', 'Could not send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [inputText, conversationId, isSending, sendMessage, emitTypingStop]);

  const handleLongPressMessage = useCallback(
    (msg: Message) => {
      const isStarred = (msg.starredBy ?? []).includes(currentUserId);
      Alert.alert(
        isStarred ? 'Unstar Message' : 'Star Message',
        `"${msg.text}"`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: isStarred ? 'Remove Star' : 'Star Message',
            onPress: () => toggleStarMessage(msg.id, conversationId),
          },
        ]
      );
    },
    [currentUserId, conversationId, toggleStarMessage]
  );

  const displayTitle =
    conversation?.type === 'group'
      ? conversation.name || name || 'Group Chat'
      : otherParticipant?.fullName || name || 'Chat';

  const displayAvatar =
    conversation?.type === 'group'
      ? conversation.avatarUrl || avatarUrl
      : otherParticipant?.avatarUrl || avatarUrl;

  const headerSubtitle = useMemo(() => {
    if (isTyping) return 'typing...';
    if (conversation?.type === 'group') {
      return `${conversation.participantIds.length} members`;
    }
    if (isOtherOnline) return 'online';
    return formatLastSeen(otherParticipant?.lastSeen);
  }, [isTyping, conversation, isOtherOnline, otherParticipant?.lastSeen]);

  const participantNameMap = useMemo(() => {
    const map = new Map<string, string>();
    conversation?.participants?.forEach((p) => {
      map.set(p.id, p.fullName);
    });
    return map;
  }, [conversation?.participants]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.chatBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <Stack.Screen
        options={{
          headerTitle: () => (
            <TouchableOpacity
              style={styles.headerTitleWrap}
              activeOpacity={0.8}
              onPress={() => {
                const targetId = otherParticipant?.id || contactId;
                if (targetId) {
                  router.push({
                    pathname: '/contact/[id]',
                    params: { id: targetId, name: displayTitle },
                  });
                }
              }}
            >
              {displayAvatar ? (
                <Image
                  source={{ uri: displayAvatar }}
                  style={styles.headerAvatar}
                />
              ) : (
                <View
                  style={[
                    styles.headerAvatarFallback,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.headerAvatarLetter}>
                    {displayTitle.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.headerTextCol}>
                <Text
                  style={[styles.headerName, { color: colors.headerText }]}
                  numberOfLines={1}
                >
                  {displayTitle}
                </Text>
                <Text
                  style={[
                    styles.headerStatus,
                    {
                      color: isTyping ? '#A7F3D0' : '#E2E8F0',
                      fontStyle: isTyping ? 'italic' : 'normal',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {headerSubtitle}
                </Text>
              </View>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRightIcons}>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Simulated Video Call',
                    `Starting simulated WhatsApp video call with ${displayTitle}...`
                  )
                }
              >
                <Ionicons name="videocam" size={22} color={colors.headerText} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Simulated Voice Call',
                    `Starting simulated WhatsApp voice call with ${displayTitle}...`
                  )
                }
              >
                <Ionicons name="call" size={20} color={colors.headerText} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isOwnMessage={item.senderId === currentUserId}
            showSenderName={conversation?.type === 'group'}
            senderName={participantNameMap.get(item.senderId)}
            isStarred={(item.starredBy ?? []).includes(currentUserId)}
            colors={colors}
            onLongPress={handleLongPressMessage}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyNoticeWrap}>
            <View
              style={[
                styles.encryptionBanner,
                { backgroundColor: colors.surface },
              ]}
            >
              <Ionicons name="lock-closed" size={14} color={colors.primary} />
              <Text
                style={[
                  styles.encryptionText,
                  { color: colors.textSecondary },
                ]}
              >
                Messages are secured with JWT authentication and delivered live via Socket.IO.
              </Text>
            </View>
          </View>
        }
      />

      {isTyping ? (
        <View
          style={[
            styles.typingBubble,
            { backgroundColor: colors.receivedBubble },
          ]}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.accent} />
          <Text style={[styles.typingBubbleText, { color: colors.textSecondary }]}>
            {displayTitle} is typing...
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          { backgroundColor: colors.chatBackground },
        ]}
      >
        <View
          style={[
            styles.inputPill,
            { backgroundColor: colors.inputBg, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="happy-outline"
            size={22}
            color={colors.textMuted}
            style={styles.emojiIcon}
          />
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { color: colors.text }]}
            placeholder="Message"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={2000}
            value={inputText}
            onChangeText={handleChangeText}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: colors.primary,
              opacity: inputText.trim().length > 0 ? 1 : 0.6,
            },
          ]}
          disabled={!inputText.trim() || isSending}
          onPress={handleSend}
        >
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 210,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  headerAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  headerTextCol: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerStatus: {
    fontSize: 12,
    marginTop: 1,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  listContent: {
    paddingVertical: 12,
  },
  emptyNoticeWrap: {
    padding: 20,
    alignItems: 'center',
  },
  encryptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: '90%',
  },
  encryptionText: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginLeft: 16,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  typingBubbleText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    minHeight: 46,
    maxHeight: 120,
  },
  emojiIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
