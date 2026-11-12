import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { chatService } from '@/services/chatService';
import { StatusUpdate } from '@/types';
import { formatChatTimestamp } from '@/utils/formatTime';

const STATUS_BG_COLORS = [
  '#075E54',
  '#128C7E',
  '#2B6CB0',
  '#6B46C1',
  '#C53030',
  '#D97706',
];

interface StatusSection {
  title: string;
  data: StatusUpdate[];
}

export default function UpdatesTabScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [statuses, setStatuses] = useState<StatusUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Create Status Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [bgIndex, setBgIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Status Modal state
  const [viewingStatus, setViewingStatus] = useState<StatusUpdate | null>(null);

  const currentUserId = user?.id || '';

  const fetchStatuses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await chatService.getStatuses();
      setStatuses(res.statuses);
    } catch {
      // Keep existing statuses on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const myLatestStatus = useMemo(
    () => statuses.find((s) => s.userId === currentUserId),
    [statuses, currentUserId]
  );

  // Group other users' statuses into Recent Updates vs Viewed Updates using SectionList
  const sections = useMemo<StatusSection[]>(() => {
    const others = statuses.filter((s) => s.userId !== currentUserId);
    const recent = others.filter((s) => !s.viewedBy.includes(currentUserId));
    const viewed = others.filter((s) => s.viewedBy.includes(currentUserId));

    const result: StatusSection[] = [];
    if (recent.length > 0) {
      result.push({ title: 'Recent updates', data: recent });
    }
    if (viewed.length > 0) {
      result.push({ title: 'Viewed updates', data: viewed });
    }
    return result;
  }, [statuses, currentUserId]);

  const handleCreateStatus = async () => {
    const trimmed = statusText.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await chatService.createStatus({
        text: trimmed,
        backgroundColor: STATUS_BG_COLORS[bgIndex],
      });
      setStatuses((prev) => [res.status, ...prev]);
      setStatusText('');
      setIsCreateOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenStatus = async (status: StatusUpdate) => {
    setViewingStatus(status);
    if (!status.viewedBy.includes(currentUserId)) {
      try {
        const res = await chatService.markStatusViewed(status.id);
        setStatuses((prev) =>
          prev.map((s) => (s.id === status.id ? res.status : s))
        );
      } catch {}
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchStatuses}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <TouchableOpacity
              style={[
                styles.myStatusRow,
                { backgroundColor: colors.surface, borderBottomColor: colors.border },
              ]}
              onPress={() =>
                myLatestStatus
                  ? handleOpenStatus(myLatestStatus)
                  : setIsCreateOpen(true)
              }
            >
              <View style={styles.myAvatarWrap}>
                {user?.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={[
                      styles.avatar,
                      myLatestStatus && {
                        borderWidth: 2.5,
                        borderColor: colors.accent,
                      },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarFallback,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={styles.avatarLetter}>
                      {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    styles.plusBadge,
                    { backgroundColor: colors.accent, borderColor: colors.surface },
                  ]}
                  onPress={() => setIsCreateOpen(true)}
                >
                  <Ionicons name="add" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.statusTextCol}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  My Status
                </Text>
                <Text
                  style={[styles.rowSubtitle, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {myLatestStatus
                    ? `${myLatestStatus.text} • ${formatChatTimestamp(
                        myLatestStatus.createdAt
                      )}`
                    : 'Tap to add status update'}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.penIconBtn,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
                onPress={() => setIsCreateOpen(true)}
              >
                <Ionicons name="pencil" size={18} color={colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Text
              style={[styles.sectionHeaderText, { color: colors.textSecondary }]}
            >
              {title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const isViewed = item.viewedBy.includes(currentUserId);
          return (
            <TouchableOpacity
              style={[
                styles.statusItemRow,
                { backgroundColor: colors.surface, borderBottomColor: colors.border },
              ]}
              onPress={() => handleOpenStatus(item)}
            >
              <View
                style={[
                  styles.statusRing,
                  {
                    borderColor: isViewed ? colors.textMuted : colors.accent,
                  },
                ]}
              >
                {item.userAvatar ? (
                  <Image
                    source={{ uri: item.userAvatar }}
                    style={styles.ringAvatar}
                  />
                ) : (
                  <View
                    style={[
                      styles.ringAvatar,
                      styles.avatarFallback,
                      { backgroundColor: item.backgroundColor || colors.primary },
                    ]}
                  >
                    <Text style={styles.avatarLetter}>
                      {item.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.statusTextCol}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  {item.userName}
                </Text>
                <Text
                  style={[styles.rowSubtitle, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.text}
                </Text>
              </View>

              <Text style={[styles.timeLabel, { color: colors.textMuted }]}>
                {formatChatTimestamp(item.createdAt)}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="disc-outline" size={52} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Contact Updates Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tap the pencil button to share a 24-hour text status update with your contacts.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => setIsCreateOpen(true)}
      >
        <Ionicons name="pencil" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Text Status Creation Modal */}
      <Modal
        visible={isCreateOpen}
        animationType="slide"
        onRequestClose={() => setIsCreateOpen(false)}
      >
        <View
          style={[
            styles.composerFull,
            { backgroundColor: STATUS_BG_COLORS[bgIndex] },
          ]}
        >
          <View style={styles.composerTopBar}>
            <TouchableOpacity onPress={() => setIsCreateOpen(false)}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.paletteBtn}
              onPress={() =>
                setBgIndex((prev) => (prev + 1) % STATUS_BG_COLORS.length)
              }
            >
              <Ionicons name="color-palette-outline" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.composerCenter}>
            <TextInput
              style={styles.composerInput}
              placeholder="Type a status..."
              placeholderTextColor="rgba(255,255,255,0.65)"
              multiline
              maxLength={280}
              value={statusText}
              onChangeText={setStatusText}
              autoFocus
            />
          </View>

          <View style={styles.composerBottomBar}>
            <Text style={styles.composerHint}>
              Visible to all contacts for 24 hours
            </Text>
            <TouchableOpacity
              style={[
                styles.postStatusBtn,
                { opacity: statusText.trim() ? 1 : 0.5 },
              ]}
              disabled={!statusText.trim() || isSubmitting}
              onPress={handleCreateStatus}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#075E54" />
              ) : (
                <Ionicons name="send" size={22} color="#075E54" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full-Screen Status Viewer Modal */}
      <Modal
        visible={Boolean(viewingStatus)}
        animationType="fade"
        onRequestClose={() => setViewingStatus(null)}
      >
        {viewingStatus ? (
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.viewerFull,
              {
                backgroundColor:
                  viewingStatus.backgroundColor || colors.primaryDark,
              },
            ]}
            onPress={() => setViewingStatus(null)}
          >
            <View style={styles.viewerTop}>
              <View style={styles.viewerProgressTrack}>
                <View style={styles.viewerProgressFill} />
              </View>
              <View style={styles.viewerUserRow}>
                {viewingStatus.userAvatar ? (
                  <Image
                    source={{ uri: viewingStatus.userAvatar }}
                    style={styles.viewerAvatar}
                  />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.viewerName}>{viewingStatus.userName}</Text>
                  <Text style={styles.viewerTime}>
                    {formatChatTimestamp(viewingStatus.createdAt)}
                  </Text>
                </View>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.viewerBody}>
              <Text style={styles.viewerText}>{viewingStatus.text}</Text>
            </View>

            <View style={styles.viewerFooter}>
              <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
              <Text style={styles.viewerViews}>
                Viewed by {viewingStatus.viewedBy.length}{' '}
                {viewingStatus.viewedBy.length === 1 ? 'person' : 'people'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  myStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  myAvatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  plusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextCol: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  penIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statusRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ringAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  timeLabel: {
    fontSize: 12,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  composerFull: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  composerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  paletteBtn: {
    padding: 4,
  },
  composerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerInput: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  composerBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  composerHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  postStatusBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerFull: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  viewerTop: {
    marginTop: 20,
  },
  viewerProgressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    marginBottom: 14,
  },
  viewerProgressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  viewerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  viewerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  viewerTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  viewerBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 36,
  },
  viewerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  viewerViews: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
