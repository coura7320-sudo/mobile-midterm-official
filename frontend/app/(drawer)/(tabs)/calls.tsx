import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat } from '@/contexts/ChatContext';

interface CallLogItem {
  id: string;
  contactName: string;
  contactAvatar: string;
  direction: 'incoming' | 'outgoing';
  missed?: boolean;
  callType: 'audio' | 'video';
  timestamp: string;
  duration: string;
}

const INITIAL_CALL_LOGS: CallLogItem[] = [
  {
    id: 'call-1',
    contactName: 'Bob Dupont',
    contactAvatar:
      'https://ui-avatars.com/api/?name=Bob%20Dupont&background=128C7E&color=fff&bold=true',
    direction: 'incoming',
    missed: false,
    callType: 'video',
    timestamp: 'Today, 14:20',
    duration: '04:12',
  },
  {
    id: 'call-2',
    contactName: 'Alice Martin',
    contactAvatar:
      'https://ui-avatars.com/api/?name=Alice%20Martin&background=128C7E&color=fff&bold=true',
    direction: 'outgoing',
    missed: false,
    callType: 'audio',
    timestamp: 'Today, 11:05',
    duration: '01:45',
  },
  {
    id: 'call-3',
    contactName: 'Bob Dupont',
    contactAvatar:
      'https://ui-avatars.com/api/?name=Bob%20Dupont&background=128C7E&color=fff&bold=true',
    direction: 'incoming',
    missed: true,
    callType: 'audio',
    timestamp: 'Yesterday, 19:48',
    duration: 'Missed',
  },
];

export default function CallsTabScreen() {
  const { colors } = useTheme();
  const { contacts } = useChat();

  const [callLogs, setCallLogs] = useState<CallLogItem[]>(INITIAL_CALL_LOGS);
  const [activeCall, setActiveCall] = useState<{
    contactName: string;
    contactAvatar: string;
    callType: 'audio' | 'video';
  } | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  useEffect(() => {
    if (!activeCall) {
      setSecondsElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCall]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const rem = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${rem}`;
  };

  const startSimulatedCall = (
    contactName: string,
    contactAvatar: string,
    callType: 'audio' | 'video'
  ) => {
    setIsMuted(false);
    setIsSpeaker(callType === 'video');
    setActiveCall({ contactName, contactAvatar, callType });
  };

  const endSimulatedCall = () => {
    if (!activeCall) return;
    const newLog: CallLogItem = {
      id: `call-${Date.now()}`,
      contactName: activeCall.contactName,
      contactAvatar: activeCall.contactAvatar,
      direction: 'outgoing',
      missed: false,
      callType: activeCall.callType,
      timestamp: 'Just now',
      duration: formatDuration(secondsElapsed),
    };
    setCallLogs((prev) => [newLog, ...prev]);
    setActiveCall(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Clearly Identified Simulated Call Notice */}
      <View
        style={[
          styles.simulatedNotice,
          { backgroundColor: colors.primary + '15', borderColor: colors.border },
        ]}
      >
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={[styles.simulatedText, { color: colors.textSecondary }]}>
          <Text style={{ fontWeight: '700', color: colors.primary }}>
            Simulated Call Functionality:{' '}
          </Text>
          Tap any audio or video icon below to launch an interactive simulated call.
        </Text>
      </View>

      <FlatList
        data={callLogs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMissed = Boolean(item.missed);
          const arrowIcon =
            item.direction === 'incoming'
              ? 'arrow-down-outline'
              : 'arrow-up-outline';
          const arrowColor = isMissed ? colors.danger : colors.accent;

          return (
            <View
              style={[
                styles.callRow,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Image
                source={{ uri: item.contactAvatar }}
                style={styles.avatar}
              />

              <View style={styles.callInfo}>
                <Text
                  style={[
                    styles.contactName,
                    { color: isMissed ? colors.danger : colors.text },
                  ]}
                >
                  {item.contactName}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons
                    name={arrowIcon}
                    size={15}
                    color={arrowColor}
                    style={{
                      transform: [
                        {
                          rotate:
                            item.direction === 'incoming' ? '45deg' : '45deg',
                        },
                      ],
                    }}
                  />
                  <Text
                    style={[styles.metaText, { color: colors.textSecondary }]}
                  >
                    {item.direction === 'incoming' ? 'Incoming' : 'Outgoing'} •{' '}
                    {item.timestamp} ({item.duration})
                  </Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() =>
                    startSimulatedCall(
                      item.contactName,
                      item.contactAvatar,
                      'audio'
                    )
                  }
                >
                  <Ionicons name="call-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() =>
                    startSimulatedCall(
                      item.contactName,
                      item.contactAvatar,
                      'video'
                    )
                  }
                >
                  <Ionicons
                    name="videocam-outline"
                    size={24}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* FAB to trigger simulated call with first contact */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => {
          const first = contacts[0];
          startSimulatedCall(
            first?.fullName || 'Bob Dupont',
            first?.avatarUrl || INITIAL_CALL_LOGS[0].contactAvatar,
            'audio'
          );
        }}
      >
        <Ionicons name="call" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Interactive Simulated Call Modal */}
      <Modal
        visible={Boolean(activeCall)}
        animationType="slide"
        onRequestClose={endSimulatedCall}
      >
        {activeCall ? (
          <View style={styles.callScreen}>
            <View style={styles.callTop}>
              <View style={styles.simPill}>
                <Ionicons name="radio-outline" size={14} color="#A7F3D0" />
                <Text style={styles.simPillText}>
                  SIMULATED {activeCall.callType.toUpperCase()} CALL
                </Text>
              </View>
              <Text style={styles.calleeName}>{activeCall.contactName}</Text>
              <Text style={styles.callTimer}>
                {secondsElapsed < 2
                  ? 'Ringing...'
                  : formatDuration(secondsElapsed)}
              </Text>
            </View>

            <View style={styles.callCenter}>
              <Image
                source={{ uri: activeCall.contactAvatar }}
                style={styles.calleeAvatar}
              />
            </View>

            <View style={styles.callControlsBar}>
              <TouchableOpacity
                style={[
                  styles.controlCircle,
                  isSpeaker && styles.controlCircleActive,
                ]}
                onPress={() => setIsSpeaker((prev) => !prev)}
              >
                <Ionicons name="volume-high" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.controlCircle,
                  isMuted && styles.controlCircleActive,
                ]}
                onPress={() => setIsMuted((prev) => !prev)}
              >
                <Ionicons
                  name={isMuted ? 'mic-off' : 'mic'}
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hangupCircle}
                onPress={endSimulatedCall}
              >
                <Ionicons
                  name="call"
                  size={26}
                  color="#FFFFFF"
                  style={{ transform: [{ rotate: '135deg' }] }}
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  simulatedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  simulatedText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
  },
  callInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 6,
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
  callScreen: {
    flex: 1,
    backgroundColor: '#075E54',
    paddingVertical: 48,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callTop: {
    alignItems: 'center',
  },
  simPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 16,
  },
  simPillText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  calleeName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  callTimer: {
    color: '#E2E8F0',
    fontSize: 16,
    marginTop: 6,
  },
  callCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calleeAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#25D366',
  },
  callControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 40,
  },
  controlCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlCircleActive: {
    backgroundColor: '#128C7E',
  },
  hangupCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EA0038',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
