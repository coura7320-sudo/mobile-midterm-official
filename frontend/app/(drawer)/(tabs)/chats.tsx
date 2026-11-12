import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat } from '@/contexts/ChatContext';
import { ConversationItem } from '@/components/ConversationItem';
import { Conversation, User } from '@/types';

type ChatFilter = 'all' | 'unread' | 'groups' | 'online';

export default function ChatsTabScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const {
    conversations,
    contacts,
    onlineUserIds,
    typingByConversation,
    isLoading,
    isOffline,
    isSyncing,
    refreshChatsAndContacts,
    startDirectConversation,
    toggleArchiveConversation,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  const currentUserId = user?.id || '';

  const archivedCount = useMemo(() => {
    return conversations.filter((c) =>
      (c.archivedBy ?? []).includes(currentUserId)
    ).length;
  }, [conversations, currentUserId]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return conversations.filter((conv) => {
      if ((conv.archivedBy ?? []).includes(currentUserId)) {
        return false;
      }

      const otherParticipant =
        conv.type === 'direct'
          ? conv.participants?.find((p) => p.id !== currentUserId)
          : undefined;

      const displayTitle =
        conv.type === 'group'
          ? conv.name || 'Group Chat'
          : otherParticipant?.fullName || conv.name || 'Contact';

      if (activeFilter === 'unread' && (conv.unreadCount || 0) === 0) {
        return false;
      }
      if (activeFilter === 'groups' && conv.type !== 'group') {
        return false;
      }
      if (activeFilter === 'online') {
        const isOnline =
          conv.type === 'direct' &&
          otherParticipant &&
          (onlineUserIds.includes(otherParticipant.id) ||
            otherParticipant.isOnline);
        if (!isOnline) return false;
      }

      if (!query) return true;

      const matchesTitle = displayTitle.toLowerCase().includes(query);
      const matchesPreview = (conv.lastMessageText || '')
        .toLowerCase()
        .includes(query);
      return matchesTitle || matchesPreview;
    });
  }, [conversations, currentUserId, activeFilter, searchQuery, onlineUserIds]);

  const handleOpenConversation = useCallback(
    (conv: Conversation, displayTitle: string, otherParticipant?: User) => {
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: conv.id,
          name: displayTitle,
          contactId: otherParticipant?.id || '',
          avatarUrl:
            conv.type === 'group'
              ? conv.avatarUrl || ''
              : otherParticipant?.avatarUrl || '',
        },
      });
    },
    [router]
  );

  const handleLongPressConversation = useCallback(
    (conv: Conversation) => {
      Alert.alert(
        'Archive Conversation',
        'Would you like to move this conversation to Archived Chats?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Archive',
            onPress: () => toggleArchiveConversation(conv.id),
          },
        ]
      );
    },
    [toggleArchiveConversation]
  );

  const handleSelectContactForNewChat = async (contact: User) => {
    setIsNewChatModalOpen(false);
    const conv = await startDirectConversation(contact.id);
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: conv.id,
        name: contact.fullName,
        contactId: contact.id,
        avatarUrl: contact.avatarUrl,
      },
    });
  };

  const renderFilterChip = (filter: ChatFilter, label: string) => {
    const selected = activeFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterChip,
          {
            backgroundColor: selected
              ? colors.primary + '22'
              : colors.surfaceSecondary,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => setActiveFilter(filter)}
      >
        <Text
          style={[
            styles.filterChipText,
            {
              color: selected ? colors.primary : colors.textSecondary,
              fontWeight: selected ? '700' : '500',
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isOffline ? (
        <TouchableOpacity
          style={[
            styles.syncBanner,
            { backgroundColor: colors.danger + '18', borderBottomColor: colors.border },
          ]}
          onPress={refreshChatsAndContacts}
        >
          <Ionicons name="cloud-offline-outline" size={16} color={colors.danger} />
          <Text style={[styles.syncBannerText, { color: colors.danger }]}>
            Offline Mode — Showing local SQLite data. Tap to retry sync.
          </Text>
        </TouchableOpacity>
      ) : isSyncing ? (
        <View
          style={[
            styles.syncBanner,
            { backgroundColor: colors.primary + '15', borderBottomColor: colors.border },
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.syncBannerText, { color: colors.primary }]}>
            Synchronizing local SQLite database with backend...
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.topHeaderControls,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search chats or messages..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filtersRow}>
          {renderFilterChip('all', 'All')}
          {renderFilterChip('unread', 'Unread')}
          {renderFilterChip('online', 'Online')}
          {renderFilterChip('groups', 'Groups')}
        </View>
      </View>

      {archivedCount > 0 ? (
        <TouchableOpacity
          style={[
            styles.archivedBanner,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
          onPress={() => router.push('/(drawer)/archived')}
        >
          <View style={styles.archivedLeft}>
            <Ionicons name="archive-outline" size={20} color={colors.primary} />
            <Text style={[styles.archivedText, { color: colors.text }]}>
              Archived
            </Text>
          </View>
          <Text style={[styles.archivedCount, { color: colors.primary }]}>
            {archivedCount}
          </Text>
        </TouchableOpacity>
      ) : null}

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshChatsAndContacts}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            currentUserId={currentUserId}
            onlineUserIds={onlineUserIds}
            typingUserIds={typingByConversation[item.id] || []}
            colors={colors}
            onPress={handleOpenConversation}
            onLongPress={handleLongPressConversation}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={54}
              color={colors.textMuted}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No conversations found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tap the green message button below to start a new chat with a contact.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        activeOpacity={0.85}
        onPress={() => setIsNewChatModalOpen(true)}
      >
        <Ionicons name="chatbubble-ellipses" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={isNewChatModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsNewChatModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.surface },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Contact
              </Text>
              <TouchableOpacity onPress={() => setIsNewChatModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={contacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isOnline =
                  onlineUserIds.includes(item.id) || item.isOnline;
                return (
                  <TouchableOpacity
                    style={[
                      styles.contactRow,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => handleSelectContactForNewChat(item)}
                  >
                    <View style={styles.contactAvatarWrap}>
                      {item.avatarUrl ? (
                        <Image
                          source={{ uri: item.avatarUrl }}
                          style={styles.contactAvatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.contactAvatarFallback,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Text style={styles.contactInitial}>
                            {item.fullName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      {isOnline ? (
                        <View
                          style={[
                            styles.contactOnlineDot,
                            {
                              backgroundColor: colors.online,
                              borderColor: colors.surface,
                            },
                          ]}
                        />
                      ) : null}
                    </View>
                    <View style={styles.contactInfo}>
                      <Text
                        style={[styles.contactName, { color: colors.text }]}
                      >
                        {item.fullName}
                      </Text>
                      <Text
                        style={[
                          styles.contactAbout,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {item.about}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContacts}>
                  <Text style={{ color: colors.textSecondary }}>
                    No other contacts registered yet. Register a second user to start chatting!
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  syncBannerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  topHeaderControls: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  archivedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  archivedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  archivedText: {
    fontSize: 15,
    fontWeight: '600',
  },
  archivedCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contactAvatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  contactAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  contactAvatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  contactOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
  },
  contactAbout: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyContacts: {
    padding: 32,
    alignItems: 'center',
  },
});
