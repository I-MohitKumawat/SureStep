/**
 * FamilyMessagesScreen — Thread-based messaging with the care team.
 * Uses the shared patient thread. Real-time via socket.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView,
  Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useFamilyContext } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socketClient';
import apiClient from '../../services/apiClient';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FamilyStackParams } from '../../types/navigation.types';

type Props = NativeStackScreenProps<FamilyStackParams, 'FamilyMessagesScreen'>;

export const FamilyMessagesScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { patient } = useFamilyContext();
  const patientId = route.params?.patientId ?? patient?.id ?? '';

  const [messages,  setMessages]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [text,      setText]      = useState('');
  const [sending,   setSending]   = useState(false);
  const flatRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    if (!patientId) return;
    try {
      const res = await apiClient.get(`/threads/patient/${patientId}`);
      const msgs = (res.data?.data?.messages ?? res.data?.messages ?? []).reverse();
      setMessages(msgs);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [patientId]);

  useEffect(() => { void load(); }, [load]);

  // Real-time new messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !patientId) return;
    const handleMsg = (m: any) => {
      if (m.patientId === patientId || m.patient_id === patientId) {
        setMessages(prev => [...prev, m]);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      }
    };
    socket.on('thread:message', handleMsg);
    return () => { socket.off('thread:message', handleMsg); };
  }, [patientId]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await apiClient.post(`/threads/patient/${patientId}/messages`, {
        message_type: 'TEXT', content: text.trim(),
      });
      setMessages(prev => [...prev, res.data?.data?.message ?? res.data?.message]);
      setText('');
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch { /* silent */ } finally { setSending(false); }
  };

  const formatTs = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther]}>
        {!isMine && (
          <Text style={s.senderName}>{item.sender_name ?? 'Care Team'}</Text>
        )}
        <Text style={[s.bubbleText, isMine && s.bubbleTextMine]}>{item.content}</Text>
        <Text style={[s.bubbleTime, isMine && s.bubbleTimeMine]}>{formatTs(item.created_at)}</Text>
      </View>
    );
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={s.screen}>
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.title}>Care Team Chat</Text>
          <Text style={s.subtitle}>{patient?.name ?? 'Patient'}'s Thread</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1, marginBottom: 80 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(item) => item.id ?? String(Math.random())}
            renderItem={renderMessage}
            contentContainerStyle={s.msgList}
            onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Ionicons name="chatbubbles-outline" size={60} color={C.textMuted} style={{ marginBottom: 12 }} />
                <Text style={s.emptyTitle}>No messages yet</Text>
                <Text style={s.emptySub}>Start a conversation with the care team.</Text>
              </View>
            }
          />

          <View style={s.inputBar}>
            <TextInput
              style={s.input}
              value={text}
              onChangeText={setText}
              placeholder="Message the care team..."
              placeholderTextColor={C.textMuted}
              multiline
              maxLength={500}
            />
            <Pressable
              style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled]}
              onPress={send}
              disabled={!text.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  screen:  { backgroundColor: C.bg },
  header:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, justifyContent: 'center' },
  title:   { fontFamily: F.extraBold, fontSize: 16, color: C.textPrimary },
  subtitle:{ fontFamily: F.regular, fontSize: 11, color: C.textMuted },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msgList: { padding: 16, paddingBottom: 16 },
  emptyWrap:  { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: F.bold, fontSize: 18, color: C.textPrimary, marginBottom: 6 },
  emptySub:   { fontFamily: F.regular, fontSize: 13, color: C.textSecondary },

  bubble:       { maxWidth: '75%', borderRadius: 16, padding: 12, marginVertical: 4, alignSelf: 'flex-start', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  bubbleMine:   { alignSelf: 'flex-end', backgroundColor: C.primary, borderColor: C.primary },
  bubbleOther:  { alignSelf: 'flex-start', backgroundColor: C.surface, borderColor: C.border },
  senderName:   { fontFamily: F.bold, fontSize: 10, color: C.primary, marginBottom: 3, letterSpacing: 0.3 },
  bubbleText:   { fontFamily: F.regular, fontSize: 14, color: C.textPrimary, lineHeight: 19 },
  bubbleTextMine:{ color: '#fff' },
  bubbleTime:   { fontFamily: F.regular, fontSize: 10, color: C.textMuted, marginTop: 4, textAlign: 'right' },
  bubbleTimeMine:{ color: 'rgba(255,255,255,0.6)' },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },
  input:    { flex: 1, fontFamily: F.regular, fontSize: 14, color: C.textPrimary, backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100 },
  sendBtn:  { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
