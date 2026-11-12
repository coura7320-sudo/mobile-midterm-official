import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat } from '@/contexts/ChatContext';
import { chatService } from '@/services/chatService';

export default function NewGroupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { contacts, refreshChatsAndContacts } = useChat();

  const [name, setName] = useState('');
  const [communityName, setCommunityName] = useState('Computer Engineering');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const toggleMember = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      Alert.alert(
        'Group Name Required',
        'Please enter a group name with at least 2 characters.'
      );
      return;
    }

    setIsCreating(true);
    try {
      const res = await chatService.createGroup({
        name: trimmedName,
        communityName: communityName.trim() || 'General Community',
        description:
          description.trim() || `Welcome to ${trimmedName} group chat!`,
        memberIds: selectedIds,
      });

      await refreshChatsAndContacts();
      setName('');
      setDescription('');
      setSelectedIds([]);

      router.replace({
        pathname: '/chat/[id]',
        params: {
          id: res.conversation.id,
          name: res.group.name,
          avatarUrl: res.group.avatarUrl,
        },
      });
    } catch {
      Alert.alert('Error', 'Could not create group. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.formCard,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.label, { color: colors.primary }]}>
          Group Subject / Name *
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderBottomColor: colors.border },
          ]}
          placeholder="e.g. Mobile Dev Study Group"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { color: colors.primary, marginTop: 14 }]}>
          Parent Community
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderBottomColor: colors.border },
          ]}
          placeholder="e.g. Computer Engineering"
          placeholderTextColor={colors.textMuted}
          value={communityName}
          onChangeText={setCommunityName}
        />

        <Text style={[styles.label, { color: colors.primary, marginTop: 14 }]}>
          Group Description
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderBottomColor: colors.border },
          ]}
          placeholder="Optional group description..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <View
        style={[
          styles.sectionBar,
          { backgroundColor: colors.surfaceSecondary },
        ]}
      >
        <Text style={[styles.sectionBarText, { color: colors.textSecondary }]}>
          Select Participants ({selectedIds.length} selected)
        </Text>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <TouchableOpacity
              style={[
                styles.contactRow,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={() => toggleMember(item.id)}
            >
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              ) : (
                <View
                  style={[
                    styles.avatarFallback,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.avatarInitial}>
                    {item.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: colors.text }]}>
                  {item.fullName}
                </Text>
                <Text
                  style={[styles.contactAbout, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.about}
                </Text>
              </View>

              <Ionicons
                name={isSelected ? 'checkbox' : 'square-outline'}
                size={24}
                color={isSelected ? colors.accent : colors.textMuted}
              />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={{ color: colors.textSecondary }}>
              No contacts found. You can still create the group with yourself as admin.
            </Text>
          </View>
        }
      />

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.createBtn,
            {
              backgroundColor: colors.primary,
              opacity: name.trim().length >= 2 && !isCreating ? 1 : 0.6,
            },
          ]}
          disabled={name.trim().length < 2 || isCreating}
          onPress={handleCreateGroup}
        >
          {isCreating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.createBtnText}>CREATE GROUP</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formCard: {
    padding: 18,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    fontSize: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  sectionBar: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sectionBarText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
  },
  contactAbout: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyWrap: {
    padding: 28,
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
