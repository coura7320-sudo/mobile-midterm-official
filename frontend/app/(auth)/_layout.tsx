import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.headerText,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="welcome"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="login"
        options={{ title: 'Log In to WhatsApp' }}
      />
      <Stack.Screen
        name="register"
        options={{ title: 'Create Account' }}
      />
    </Stack>
  );
}
