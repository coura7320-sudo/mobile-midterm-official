import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';

function RootNavigator() {
  const { colors } = useTheme();

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
        <Stack.Screen name="contact/[id]" options={{ title: 'Contact Info' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <ChatProvider>
            <RootNavigator />
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
