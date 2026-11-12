import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface DrawerMenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const MENU_ITEMS: DrawerMenuItem[] = [
  { label: 'Chats (Home)', icon: 'chatbubbles-outline', route: '/(drawer)/(tabs)/chats' },
  { label: 'Profile', icon: 'person-outline', route: '/(drawer)/profile' },
  { label: 'New Group', icon: 'people-outline', route: '/(drawer)/new-group' },
  { label: 'Starred Messages', icon: 'star-outline', route: '/(drawer)/starred' },
  { label: 'Archived Chats', icon: 'archive-outline', route: '/(drawer)/archived' },
  { label: 'Settings', icon: 'settings-outline', route: '/(drawer)/settings' },
  { label: 'Help', icon: 'help-circle-outline', route: '/(drawer)/help' },
];

export interface CustomDrawerProps {
  navigation: {
    closeDrawer: () => void;
  };
}

export function CustomDrawerContent(props: CustomDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { colors } = useTheme();

  const handleNavigate = (route: string) => {
    props.navigation.closeDrawer();
    router.push(route as never);
  };

  const handleLogout = async () => {
    props.navigation.closeDrawer();
    await logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.surface }]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.headerBg },
        ]}
      >
        <View style={styles.avatarRow}>
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={[
                styles.avatarFallback,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.avatarInitial}>
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={[styles.onlineDot, { backgroundColor: colors.online }]} />
        </View>

        <Text style={styles.userName} numberOfLines={1}>
          {user?.fullName || 'WhatsApp User'}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1}>
          {user?.email || ''}
        </Text>
        <Text style={styles.userAbout} numberOfLines={1}>
          {user?.about || 'Hey there! I am using WhatsApp.'}
        </Text>
      </View>

      <ScrollView
        style={styles.menuScroll}
        contentContainerStyle={styles.menuContent}
      >
        {MENU_ITEMS.map((item) => {
          const isActive =
            pathname === item.route.replace('/(drawer)/(tabs)', '').replace('/(drawer)', '') ||
            (item.route.endsWith('/chats') && pathname === '/chats');

          return (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.menuItem,
                isActive && { backgroundColor: colors.primary + '1A' },
              ]}
              onPress={() => handleNavigate(item.route)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={isActive ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.menuLabel,
                  {
                    color: isActive ? colors.primary : colors.text,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.75}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          <Text style={[styles.logoutLabel, { color: colors.danger }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
  },
  avatarRow: {
    position: 'relative',
    width: 64,
    height: 64,
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#075E54',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    color: '#E2E8F0',
    fontSize: 13,
    marginTop: 2,
  },
  userAbout: {
    color: '#CBD5E1',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 2,
  },
  menuLabel: {
    fontSize: 15,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
});
