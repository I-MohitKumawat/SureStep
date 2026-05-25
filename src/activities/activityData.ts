/**
 * SureStep â€“ Activity Data Store
 * Centralised mock data, types and a lightweight runtime state store
 * for the enhanced activity hub (gamification + analytics).
 */

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type CategoryId = 'games' | 'workout' | 'relaxing';

export interface Activity {
  id: string;
  categoryId: CategoryId;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  skills: string[];
  instructions: string[];
  difficulty: Difficulty;
  durationMin: number;
  patientType: string;
  xpReward: number;
  color: string;       // accent hex
  bgColor: string;     // card bg hex
}

export interface ActivityCategory {
  id: CategoryId;
  icon: string;
  label: string;
  color: string;
  bgColor: string;
  activities: Activity[];
}

export interface ActivitySession {
  activityId: string;
  date: string;        // ISO date string YYYY-MM-DD
  score: number;
  xpEarned: number;
  completed: boolean;
  durationSec: number;
}

export interface PlayerProfile {
  xp: number;
  level: number;
  streak: number;         // consecutive days
  lastPlayedDate: string; // YYYY-MM-DD
  totalCompleted: number;
  badges: string[];       // badge ids earned
  sessions: ActivitySession[];
}

// â”€â”€â”€ Mock Activity Catalogue â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const ACTIVITY_CATALOGUE: ActivityCategory[] = [
  {
    id: 'games',
    icon: 'ðŸ§©',
    label: 'Games',
    color: '#4F46E5',
    bgColor: '#EEF2FF',
    activities: [
      {
        id: 'memory-match',
        categoryId: 'games',
        icon: 'ðŸƒ',
        title: 'Match the Pairs',
        subtitle: 'Find matching pairs of cards',
        description: 'Flip cards and find the matching pairs.',
        benefits: ['Helps memory', 'Fun and calming'],
        skills: ['Memory', 'Focus'],
        instructions: ['Tap a card to flip it, then find its matching pair.'],
        difficulty: 'Easy',
        durationMin: 5,
        patientType: 'All patients',
        xpReward: 50,
        color: '#4F46E5',
        bgColor: '#EEF2FF',
      },
      {
        id: 'word-search',
        categoryId: 'games',
        icon: 'ðŸ”¤',
        title: 'Word Search',
        subtitle: 'Find hidden words in the grid',
        description: 'Spot and tap words hidden in a letter grid.',
        benefits: ['Good for focus', 'Builds word recall'],
        skills: ['Language', 'Attention'],
        instructions: ['Look for words in the grid and tap each letter to select them.'],
        difficulty: 'Easy',
        durationMin: 5,
        patientType: 'All patients',
        xpReward: 45,
        color: '#059669',
        bgColor: '#ECFDF5',
      },
      {
        id: 'jigsaw-puzzle',
        categoryId: 'games',
        icon: 'ðŸ§©',
        title: 'Jigsaw Puzzle',
        subtitle: 'Drag pieces to complete the picture',
        description: 'Arrange puzzle pieces to form a complete picture.',
        benefits: ['Improves problem solving', 'Enjoyable and relaxing'],
        skills: ['Spatial Reasoning', 'Focus'],
        instructions: ['Drag each piece to its correct spot to complete the picture.'],
        difficulty: 'Medium',
        durationMin: 7,
        patientType: 'All patients',
        xpReward: 60,
        color: '#7C3AED',
        bgColor: '#F5F3FF',
      },
    ],
  },
  {
    id: 'workout',
    icon: 'ðŸ‹ï¸',
    label: 'Workout',
    color: '#16A34A',
    bgColor: '#F0FDF4',
    activities: [
      {
        id: 'sit-and-step',
        categoryId: 'workout',
        icon: 'ðŸª‘',
        title: 'Sit & Step Strength',
        subtitle: 'Seated leg exercises',
        description: 'Lift each knee up and down while sitting. Safe and easy.',
        benefits: ['Gets blood moving', 'Safe for all abilities'],
        skills: ['Leg Strength', 'Coordination'],
        instructions: ['Sit tall and lift each knee up in turn. Tap each time you lift.'],
        difficulty: 'Easy',
        durationMin: 5,
        patientType: 'All patients',
        xpReward: 50,
        color: '#16A34A',
        bgColor: '#F0FDF4',
      },
      {
        id: 'spin-and-strengthen',
        categoryId: 'workout',
        icon: 'ðŸ’ª',
        title: 'Spin & Strengthen',
        subtitle: 'Arm and shoulder circles',
        description: 'Stretch arms out and slowly circle them forward then back.',
        benefits: ['Eases stiff shoulders', 'Feels refreshing'],
        skills: ['Flexibility', 'Coordination'],
        instructions: ['Hold your arms out and make slow circles â€” forward 5 times, then backward.'],
        difficulty: 'Easy',
        durationMin: 4,
        patientType: 'All patients',
        xpReward: 45,
        color: '#15803D',
        bgColor: '#DCFCE7',
      },
      {
        id: 'neck-relief',
        categoryId: 'workout',
        icon: 'ðŸ§˜',
        title: 'Neck Relief Routine',
        subtitle: 'Gentle neck stretch',
        description: 'Slowly roll your head side to side. Nice and easy.',
        benefits: ['Eases neck tension', 'Feels relaxing'],
        skills: ['Flexibility', 'Relaxation'],
        instructions: ['Gently tilt your head in each direction shown. Move slowly and softly.'],
        difficulty: 'Easy',
        durationMin: 4,
        patientType: 'All patients',
        xpReward: 40,
        color: '#14532D',
        bgColor: '#DCFCE7',
      },
    ],
  },
  {
    id: 'relaxing',
    icon: 'ðŸŽµ',
    label: 'Relaxing',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    activities: [
      {
        id: 'music-listen',
        categoryId: 'relaxing',
        icon: 'ðŸŽµ',
        title: 'Listening to Music',
        subtitle: 'Pick a song and relax',
        description: 'Choose a gentle melody and simply listen. Nothing else needed.',
        benefits: ['Lifts your mood', 'Calming and soothing'],
        skills: ['Relaxation', 'Listening'],
        instructions: ['Pick a song, press play, and enjoy. Tap Done when you are ready to finish.'],
        difficulty: 'Easy',
        durationMin: 5,
        patientType: 'All patients',
        xpReward: 35,
        color: '#7C3AED',
        bgColor: '#F5F3FF',
      },
      {
        id: 'meditation',
        categoryId: 'relaxing',
        icon: 'ðŸŒ¸',
        title: 'Meditation',
        subtitle: 'Sit quietly and feel calm',
        description: 'Close your eyes, breathe slowly, and let your thoughts settle.',
        benefits: ['Calms the mind', 'Reduces stress'],
        skills: ['Mindfulness', 'Relaxation'],
        instructions: ['Close your eyes and breathe slowly. Tap each prompt as it appears.'],
        difficulty: 'Easy',
        durationMin: 6,
        patientType: 'All patients',
        xpReward: 35,
        color: '#9333EA',
        bgColor: '#FAF5FF',
      },
      {
        id: 'breathing-exercise',
        categoryId: 'relaxing',
        icon: 'ðŸŒ¿',
        title: 'Breathing Exercise',
        subtitle: 'Follow the bubble to breathe',
        description: 'Watch the bubble and breathe with it. In, hold, and out.',
        benefits: ['Calms anxiety', 'Easy to follow'],
        skills: ['Breathing', 'Mindfulness'],
        instructions: ['Watch the bubble and breathe along. Tap it to move to the next step.'],
        difficulty: 'Easy',
        durationMin: 5,
        patientType: 'All patients',
        xpReward: 35,
        color: '#0EA5E9',
        bgColor: '#F0F9FF',
      },
    ],
  },
];

// â”€â”€â”€ Flatten all activities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const ALL_ACTIVITIES: Activity[] = ACTIVITY_CATALOGUE.flatMap((c) => c.activities);

export function getActivityById(id: string): Activity | undefined {
  return ALL_ACTIVITIES.find((a) => a.id === id);
}

export function getCategoryById(id: CategoryId): ActivityCategory | undefined {
  return ACTIVITY_CATALOGUE.find((c) => c.id === id);
}

// â”€â”€â”€ Runtime State (in-memory, session-scoped) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// In a real app this would be persisted via AsyncStorage / Supabase.

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const _sessions: ActivitySession[] = [];

let _profile: PlayerProfile = {
  xp: 320,
  level: 3,
  streak: 5,
  lastPlayedDate: todayIso(),
  totalCompleted: 18,
  badges: ['first-play', 'week-streak', 'memory-master'],
  sessions: _sessions,
};

export function getProfile(): PlayerProfile {
  return _profile;
}

export function recordSession(session: Omit<ActivitySession, 'date'>): void {
  const today = todayIso();
  const s: ActivitySession = { ...session, date: today };
  _profile.sessions.push(s);
  if (session.completed) {
    _profile.xp += session.xpEarned;
    _profile.totalCompleted += 1;
    if (_profile.xp >= _profile.level * 200) _profile.level += 1;
    if (_profile.lastPlayedDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      _profile.streak = _profile.lastPlayedDate === yStr ? _profile.streak + 1 : 1;
      _profile.lastPlayedDate = today;
    }
  }
}

export function wasPlayedToday(activityId: string): boolean {
  const today = todayIso();
  return _profile.sessions.some((s) => s.activityId === activityId && s.date === today && s.completed);
}

// â”€â”€â”€ Weekly Analytics (mock) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface WeeklyStats {
  day: string;    // 'Mon' etc.
  completed: number;
  focusScore: number;
  relaxScore: number;
  memoryScore: number;
}

export const WEEKLY_STATS: WeeklyStats[] = [
  { day: 'Mon', completed: 3, focusScore: 72, relaxScore: 80, memoryScore: 65 },
  { day: 'Tue', completed: 2, focusScore: 68, relaxScore: 75, memoryScore: 70 },
  { day: 'Wed', completed: 4, focusScore: 80, relaxScore: 85, memoryScore: 78 },
  { day: 'Thu', completed: 1, focusScore: 60, relaxScore: 70, memoryScore: 60 },
  { day: 'Fri', completed: 3, focusScore: 75, relaxScore: 88, memoryScore: 82 },
  { day: 'Sat', completed: 5, focusScore: 88, relaxScore: 92, memoryScore: 90 },
  { day: 'Sun', completed: 2, focusScore: 70, relaxScore: 78, memoryScore: 72 },
];

// â”€â”€â”€ Motivational messages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const MOTIVATIONAL = [
  'You are doing amazing! ðŸŒŸ',
  'Every step forward matters ðŸ’ª',
  'Your brain is growing stronger! ðŸ§ ',
  'Keep it up â€” you inspire us! ðŸŒ¸',
  'Progress is happening every day âœ¨',
  'Small wins lead to big victories ðŸ†',
];

export function getMotivationalMessage(): string {
  return MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)];
}

// â”€â”€â”€ Recommendations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function getRecommendations(): Activity[] {
  // Simple rule: recommend activities not played today, preferring Easy ones
  const today = todayIso();
  const playedIds = _profile.sessions
    .filter((s) => s.date === today)
    .map((s) => s.activityId);

  const notPlayed = ALL_ACTIVITIES.filter((a) => !playedIds.includes(a.id));
  const easy = notPlayed.filter((a) => a.difficulty === 'Easy');
  const pool = easy.length >= 3 ? easy : notPlayed;
  return pool.slice(0, 3);
}

// â”€â”€â”€ Badge definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const BADGES: Record<string, { icon: string; label: string; desc: string }> = {
  'first-play':     { icon: 'ðŸŽ‰', label: 'First Step',      desc: 'Completed your first activity' },
  'week-streak':    { icon: 'ðŸ”¥', label: 'Week Warrior',    desc: '7-day activity streak' },
  'memory-master':  { icon: 'ðŸ§ ', label: 'Memory Master',   desc: 'Completed all memory games' },
  'chill-champion': { icon: 'ðŸŒ¿', label: 'Chill Champion',  desc: 'Completed all relaxing activities' },
  'fit-hero':       { icon: 'ðŸ’ª', label: 'Fit Hero',        desc: 'Completed all workout exercises' },
  'star-player':    { icon: 'â­', label: 'Star Player',     desc: 'Earned 500 XP in total' },
};
