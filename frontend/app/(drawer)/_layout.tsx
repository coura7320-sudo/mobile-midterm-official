import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { useTheme } from '@/contexts/ThemeContext';
import { CustomDrawerContent } from '@/components/CustomDrawerContent';

export default function DrawerLayout() {
  const { colors } = useTheme();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.headerText,
        headerTitleStyle: { fontWeight: '700', fontSize: 19 },
        drawerStyle: {
          backgroundColor: colors.surface,
          width: 290,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          title: 'WhatsApp',
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{ title: 'Profile' }}
      />
      <Drawer.Screen
        name="new-group"
        options={{ title: 'New Group' }}
      />
      <Drawer.Screen
        name="starred"
        options={{ title: 'Starred Messages' }}
      />
      <Drawer.Screen
        name="archived"
        options={{ title: 'Archived Chats' }}
      />
      <Drawer.Screen
        name="settings"
        options={{ title: 'Settings' }}
      />
      <Drawer.Screen
        name="help"
        options={{ title: 'Help' }}
      />
    </Drawer>
  );
}
