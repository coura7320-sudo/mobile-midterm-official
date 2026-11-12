import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat } from '@/contexts/ChatContext';
import { chatService } from '@/services/chatService';
import { Group, User } from '@/types';

type EnrichedGroup = Group & { isMember?: boolean; members?: User[] };

interface CommunitySection {
  title: string;
  data: EnrichedGroup[];
}

export default function CommunitiesTabScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { refreshChatsAndContacts } = useChat();

  const [groups, setGroups] = useState<EnrichedGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<EnrichedGroup | null>(null);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await chatService.getGroups();
      setGroups(res.groups);
    } catch {
      // Keep cached groups
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const sections = useMemo<CommunitySection[]>(() => {
    const map = new Map<string, EnrichedGroup[]>();
    for (const g of groups) {
      const comm = g.communityName || 'General Community';
      const list = map.get(comm) || [];
      list.push(g);
      map.set(comm, list);
    }
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [groups]);

  const handleOpenGroupChat = async (group: EnrichedGroup) => {
    setSelectedGroup(null);
    await refreshChatsAndContacts();
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: group.conversationId,
        name: group.name,
        avatarUrl: group.avatarUrl,
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadGroups}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <TouchableOpacity
            style={[
              styles.newCommunityBanner,
              { backgroundColor: colors.surface, borderBottomColor: colors.border },
            ]}
            onPress={() => router.push('/(drawer)/new-group')}
          >
            <View
              style={[
                styles.communityIconBox,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="people" size={26} color="#FFFFFF" />
              <View
                style={[
                  styles.plusBadge,
                  { backgroundColor: colors.accent, borderColor: colors.surface },
                ]}
              >
                <Ionicons name="add" size={12} color="#FFFFFF" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.text }]}>
                New Community / Group
              </Text>
              <Text
                style={[styles.bannerSubtitle, { color: colors.textSecondary }]}
              >
                Bring members together in topic-based groups
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            ]}
          >
            <Ionicons name="megaphone-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.groupRow,
              { backgroundColor: colors.surface, borderBottomColor: colors.border },
            ]}
            onPress={() => setSelectedGroup(item)}
          >
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.groupAvatar} />
            ) : (
              <View
                style={[
                  styles.groupAvatarFallback,
                  { backgroundColor: colors.primaryDark },
                ]}
              >
                <Ionicons name="people" size={22} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.groupInfo}>
              <Text style={[styles.groupName, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text
                style={[styles.groupDesc, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.description} • {item.memberIds.length}{' '}
                {item.memberIds.length === 1 ? 'member' : 'members'}
              </Text>
            </View>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={56} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Community Groups Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tap &ldquo;New Community / Group&rdquo; above to create your first group and invite contacts!
            </Text>
          </View>
        }
      />

      {/* Community & Group Details + Member List Modal */}
      <Modal
        visible={Boolean(selectedGroup)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedGroup(null)}
      >
        <View style={styles.modalBackdrop}>
          {selectedGroup ? (
            <View
              style={[
                styles.modalCard,
                { backgroundColor: colors.surface },
              ]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View>
                  <Text style={[styles.modalCommTag, { color: colors.primary }]}>
                    {selectedGroup.communityName || 'General Community'}
                  </Text>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {selectedGroup.name}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedGroup(null)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text
                  style={[styles.groupDescription, { color: colors.textSecondary }]}
                >
                  {selectedGroup.description}
                </Text>

                <Text
                  style={[styles.membersHeading, { color: colors.primary }]}
                >
                  Group Members ({selectedGroup.members?.length || selectedGroup.memberIds.length})
                </Text>

                {(selectedGroup.members || []).map((member) => {
                  const isAdmin = selectedGroup.adminIds.includes(member.id);
                  return (
                    <View
                      key={member.id}
                      style={[
                        styles.memberRow,
                        { borderBottomColor: colors.border },
                      ]}
                    >
                      {member.avatarUrl ? (
                        <Image
                          source={{ uri: member.avatarUrl }}
                          style={styles.memberAvatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.memberAvatarFallback,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Text style={styles.memberInitial}>
                            {member.fullName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.memberName, { color: colors.text }]}>
                          {member.fullName}
                        </Text>
                        <Text
                          style={[
                            styles.memberEmail,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {member.email}
                        </Text>
                      </View>
                      {isAdmin ? (
                        <View
                          style={[
                            styles.adminBadge,
                            { backgroundColor: colors.primary + '20' },
                          ]}
                        >
                          <Text
                            style={[styles.adminText, { color: colors.primary }]}
                          >
                            Group Admin
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[
                    styles.openChatBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleOpenGroupChat(selectedGroup)}
                >
                  <Ionicons name="chatbubbles" size={18} color="#FFFFFF" />
                  <Text style={styles.openChatText}>OPEN GROUP CHAT</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  newCommunityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 8,
  },
  communityIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
  },
  plusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  bannerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
  },
  groupAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
  },
  groupDesc: {
    fontSize: 13,
    marginTop: 3,
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '82%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCommTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  groupDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  membersHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInitial: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 12,
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adminText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalFooter: {
    padding: 20,
  },
  openChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
  },
  openChatText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
