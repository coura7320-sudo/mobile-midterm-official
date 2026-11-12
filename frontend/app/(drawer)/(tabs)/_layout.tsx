import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Tabs, useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat } from '@/contexts/ChatContext';

export default function TabsLayout() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { totalUnreadCount } = useChat();
  const navigation = useNavigation();
  const router = useRouter();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.headerText,
        headerTitleStyle: { fontWeight: '700', fontSize: 20 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={openDrawer}
            style={styles.headerLeftBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu" size={26} color={colors.headerText} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={styles.headerRightRow}>
            <TouchableOpacity
              onPress={toggleTheme}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={22}
                color={colors.headerText}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(drawer)/new-group')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="people-outline" size={23} color={colors.headerText} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(drawer)/settings')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={21}
                color={colors.headerText}
              />
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          headerTitle: 'WhatsApp',
          tabBarBadge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.unreadBadge,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="updates"
        options={{
          title: 'Updates',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'disc' : 'disc-outline'}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: 'Communities',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'call' : 'call-outline'}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLeftBtn: {
    marginLeft: 16,
    marginRight: 8,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginRight: 16,
  },
});
