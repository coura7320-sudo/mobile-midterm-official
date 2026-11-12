export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  isDark: boolean;
  primary: string;
  primaryDark: string;
  accent: string;
  headerBg: string;
  headerText: string;
  background: string;
  chatBackground: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  sentBubble: string;
  sentBubbleText: string;
  receivedBubble: string;
  receivedBubbleText: string;
  inputBg: string;
  danger: string;
  online: string;
  unreadBadge: string;
  tickRead: string;
  tickDefault: string;
}

export const lightColors: ThemeColors = {
  isDark: false,
  primary: '#128C7E',
  primaryDark: '#075E54',
  accent: '#25D366',
  headerBg: '#075E54',
  headerText: '#FFFFFF',
  background: '#FFFFFF',
  chatBackground: '#ECE5DD',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0F2F5',
  text: '#111B21',
  textSecondary: '#54656F',
  textMuted: '#8696A0',
  border: '#E9EDEF',
  sentBubble: '#DCF8C6',
  sentBubbleText: '#111B21',
  receivedBubble: '#FFFFFF',
  receivedBubbleText: '#111B21',
  inputBg: '#FFFFFF',
  danger: '#EA0038',
  online: '#25D366',
  unreadBadge: '#25D366',
  tickRead: '#34B7F1',
  tickDefault: '#8696A0',
};

export const darkColors: ThemeColors = {
  isDark: true,
  primary: '#00A884',
  primaryDark: '#1F2C34',
  accent: '#00A884',
  headerBg: '#1F2C34',
  headerText: '#E9EDEF',
  background: '#111B21',
  chatBackground: '#0B141A',
  surface: '#1F2C34',
  surfaceSecondary: '#202C33',
  text: '#E9EDEF',
  textSecondary: '#8696A0',
  textMuted: '#667781',
  border: '#222D34',
  sentBubble: '#005C4B',
  sentBubbleText: '#E9EDEF',
  receivedBubble: '#202C33',
  receivedBubbleText: '#E9EDEF',
  inputBg: '#2A3942',
  danger: '#F15C6D',
  online: '#00A884',
  unreadBadge: '#00A884',
  tickRead: '#53BDEB',
  tickDefault: '#8696A0',
};
