import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';

type Props = NativeStackScreenProps<HomeStackParamList, 'AskAi'>;

// ─── Smart suggestions ────────────────────────────────────────────────────────
const SUGGESTIONS = [
  {
    id: 'med',
    icon: '💊',
    colour: '#DCFCE7',
    iconBg: '#4ADE80',
    title: 'Check my medication',
    subtitle: 'Next dose: 2:00 PM',
    answer: "Your next medication is at **2:00 PM**. You have Amlodipine 5mg due then. Make sure to take it with a full glass of water after your meal. Would you like me to remind you?",
  },
  {
    id: 'heart',
    icon: '💓',
    colour: '#EFF6FF',
    iconBg: '#93C5FD',
    title: 'Heart rate today?',
    subtitle: 'Currently 72 BPM',
    answer: "Your heart rate is **72 BPM** — that is perfectly within the healthy resting range of 60–100 BPM. You are doing great! Try a short walk today to keep it steady.",
  },
  {
    id: 'walk',
    icon: '🚶',
    colour: '#F0FFF4',
    iconBg: '#34D399',
    title: 'When is my next walk?',
    subtitle: 'Scheduled for 4:30 PM',
    answer: "Your next walk is scheduled for **4:30 PM** today. It is a 30-minute gentle stroll. Remember to wear comfortable shoes and carry some water. The weather looks good!",
  },
  {
    id: 'sleep',
    icon: '😴',
    colour: '#FAF5FF',
    iconBg: '#C084FC',
    title: 'How was my sleep?',
    subtitle: 'Last night: 7.5 hrs',
    answer: "You slept for **7.5 hours** last night — that is excellent! Adults need 7–9 hours for optimal health. Your sleep was mostly uninterrupted. Keep up this routine!",
  },
  {
    id: 'water',
    icon: '💧',
    colour: '#F0F9FF',
    iconBg: '#38BDF8',
    title: 'Am I hydrated enough?',
    subtitle: '4 of 8 glasses today',
    answer: "You have had **4 of your 8 recommended glasses** of water today. Try to drink a glass with each meal and one between meals. Staying hydrated helps with energy and focus.",
  },
];

// ─── Local mock AI engine ──────────────────────────────────────────────────────
function getAiAnswer(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('medic') || q.includes('pill') || q.includes('tablet'))
    return "Your next medication is Amlodipine 5mg at **2:00 PM**. Always take with water. Let me know if you need a reminder set!";
  if (q.includes('heart') || q.includes('bpm') || q.includes('pulse'))
    return "Your resting heart rate is **72 BPM** — healthy and steady. If you feel palpitations or chest discomfort, please alert your caregiver immediately.";
  if (q.includes('walk') || q.includes('exercise') || q.includes('step'))
    return "Your next walk is at **4:30 PM** for 30 minutes. Light exercise is great for circulation and mood. Remember to take it slow and rest if needed.";
  if (q.includes('sleep') || q.includes('rest') || q.includes('nap'))
    return "You slept **7.5 hours** last night — well above the minimum. A short 20-minute nap after lunch is fine, but avoid napping after 3 PM to protect your night sleep.";
  if (q.includes('water') || q.includes('drink') || q.includes('hydrat'))
    return "You are halfway through your daily water goal — **4 of 8 glasses**. Have a glass right now and another with dinner. Hydration improves energy and helps your medication work better.";
  if (q.includes('caregiver') || q.includes('nurse') || q.includes('doctor'))
    return "Your caregiver is available today. You can view their contact details in the Caregiver tab. If it is urgent, tap the **Ask AI** button and say 'urgent'.";
  if (q.includes('task') || q.includes('routine') || q.includes('today'))
    return "Today you have **3 tasks** remaining: afternoon medication, a 30-minute walk, and your evening blood pressure check. You can track these on your Home screen.";
  if (q.includes('pain') || q.includes('hurt') || q.includes('unwell') || q.includes('sick'))
    return "I am sorry to hear that. Please **alert your caregiver immediately** using the emergency button. Do not wait — your health comes first. Would you like me to help contact them?";
  return `I heard you say: **"${query}"**. I am still learning! For now, try asking me about your medication, heart rate, walk schedule, sleep, or hydration. Your caregiver can answer anything more specific.`;
}

// ─── Message bubble types ─────────────────────────────────────────────────────
type Msg = { id: string; role: 'user' | 'ai'; text: string };

function parseBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1
      ? <Text key={i} style={{ fontFamily: F.bold }}>{p}</Text>
      : <Text key={i}>{p}</Text>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export const AskAiScreen: React.FC<Props> = ({ navigation }) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput]       = useState('');
  const [typing, setTyping]     = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput('');
    const userMsg: Msg = { id: `u_${Date.now()}`, role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);
    setTimeout(() => {
      const aiText = getAiAnswer(trimmed);
      const aiMsg: Msg = { id: `a_${Date.now()}`, role: 'ai', text: aiText };
      setMessages((prev) => [...prev, aiMsg]);
      setTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 900);
  };

  const tapSuggestion = (s: typeof SUGGESTIONS[0]) => {
    sendMessage(s.title);
  };

  const showSuggestions = messages.length === 0;

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>✦✦{'\n'}✦✦</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Ask AI</Text>
            <Text style={styles.headerSub}>Your health assistant</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Greeting / Suggestions ── */}
          {showSuggestions && (
            <>
              <Text style={styles.greeting}>I can help you with…</Text>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => tapSuggestion(s)}
                  style={({ pressed }) => [styles.suggestionCard, pressed && { opacity: 0.85 }]}
                >
                  <View style={[styles.suggestionIconBg, { backgroundColor: s.iconBg }]}>
                    <Text style={styles.suggestionIcon}>{s.icon}</Text>
                  </View>
                  <View style={styles.suggestionText}>
                    <Text style={styles.suggestionTitle}>{s.title}</Text>
                    <Text style={styles.suggestionSub}>{s.subtitle}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </>
          )}

          {/* ── Chat messages ── */}
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubbleRow,
                m.role === 'user' ? styles.bubbleRowUser : styles.bubbleRowAi,
              ]}
            >
              {m.role === 'ai' && (
                <View style={styles.aiBubbleAvatar}>
                  <Text style={styles.aiBubbleAvatarText}>✦</Text>
                </View>
              )}
              <View style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
                <Text style={[styles.bubbleText, m.role === 'user' && styles.bubbleTextUser]}>
                  {m.role === 'ai' ? parseBold(m.text) : m.text}
                </Text>
              </View>
            </View>
          ))}

          {typing && (
            <View style={[styles.bubbleRow, styles.bubbleRowAi]}>
              <View style={styles.aiBubbleAvatar}>
                <Text style={styles.aiBubbleAvatarText}>✦</Text>
              </View>
              <View style={[styles.bubble, styles.bubbleAi]}>
                <Text style={styles.bubbleText}>Thinking…</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Input bar ── */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything…"
            placeholderTextColor={C.textMuted}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
            multiline={false}
          />
          <Pressable
            onPress={() => sendMessage(input)}
            style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.sendIcon}>🎤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { backgroundColor: '#F5F7FA', paddingHorizontal: 0, paddingVertical: 0 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 30, color: C.primary, lineHeight: 34, marginTop: -4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  aiAvatarText: { fontSize: 8, color: '#fff', textAlign: 'center', lineHeight: 10, letterSpacing: 1.5 },
  headerTitle: { fontFamily: F.extraBold, fontSize: 17, color: C.textPrimary },
  headerSub:   { fontFamily: F.medium,    fontSize: 11, color: C.textMuted, marginTop: 1 },

  // Scroll content
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },

  // Greeting
  greeting: { fontFamily: F.extraBold, fontSize: 22, color: C.textPrimary, marginBottom: 20 },

  // Suggestion cards
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  suggestionIconBg: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  suggestionIcon:  { fontSize: 22 },
  suggestionText:  { flex: 1 },
  suggestionTitle: { fontFamily: F.bold,    fontSize: 15, color: C.textPrimary },
  suggestionSub:   { fontFamily: F.regular, fontSize: 12, color: C.textSecondary, marginTop: 2 },
  chevron:         { fontSize: 22, color: C.textMuted, marginLeft: 8 },

  // Chat bubbles
  bubbleRow:     { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAi:   { justifyContent: 'flex-start' },
  aiBubbleAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8, marginBottom: 2,
  },
  aiBubbleAvatarText: { fontSize: 9, color: '#fff', textAlign: 'center' },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: C.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  bubbleText:     { fontFamily: F.regular, fontSize: 14, color: C.textPrimary, lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 46,
    backgroundColor: '#F0F2F5',
    borderRadius: 23,
    paddingHorizontal: 18,
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textPrimary,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 6,
  },
  sendIcon: { fontSize: 20 },
});
