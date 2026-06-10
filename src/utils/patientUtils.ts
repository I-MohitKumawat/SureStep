import { C } from '../theme/colors';

export type TaskMeta = {
  emoji: string;
  hint: string;
  duration: string;
  detail: string;
  tip: string;
};

export function getTaskMeta(title: string): TaskMeta {
  const t = title.toLowerCase();

  if (t.includes('med') || t.includes('pill') || t.includes('tablet')) {
    return {
      emoji: '💊',
      hint: 'Before breakfast',
      duration: '5 mins',
      detail: 'Morning Medication',
      tip: "Take 1 tablet of Amlodipine 5mg with a full glass of water. Always take at the same time each day. Do not skip doses — if you miss one, take it as soon as you remember unless it's almost time for the next dose.",
    };
  }
  if (t.includes('breakfast') || t.includes('meal') || t.includes('food') || t.includes('eat')) {
    return {
      emoji: '🥣',
      hint: 'After medication',
      duration: '20 mins',
      detail: 'Healthy Breakfast',
      tip: 'Have a balanced breakfast: oatmeal or whole-grain toast with fruit. Avoid high-sugar cereals. A good breakfast provides energy for morning activities and stabilises blood sugar throughout the day.',
    };
  }
  if (t.includes('walk') || t.includes('exercise') || t.includes('jog') || t.includes('step')) {
    return {
      emoji: '🚶',
      hint: 'Morning exercise',
      duration: '30 mins',
      detail: 'Daily Walk',
      tip: "Walk at a comfortable pace for 30 minutes. Wear supportive shoes and take water. If you feel dizzy or short of breath, stop and rest. A daily walk improves circulation, mood, and joint flexibility.",
    };
  }
  if (t.includes('water') || t.includes('drink') || t.includes('hydrat')) {
    return {
      emoji: '💧',
      hint: 'Stay hydrated',
      duration: '2 mins',
      detail: 'Hydration Check',
      tip: 'Drink at least 2 glasses of water with each check-in. Older adults are at higher risk of dehydration. Keep a bottle nearby and sip regularly throughout the day, even if you don\'t feel thirsty.',
    };
  }
  if (t.includes('sleep') || t.includes('nap') || t.includes('rest')) {
    return {
      emoji: '💤',
      hint: 'Rest time',
      duration: '60 mins',
      detail: 'Rest / Nap Time',
      tip: 'Lie down in a comfortable, quiet room. A short nap of 20–30 minutes can boost alertness without affecting night sleep. Avoid napping after 3 PM if you have difficulty sleeping at night.',
    };
  }
  if (t.includes('blood') || t.includes('bp') || t.includes('pressure') || t.includes('sugar') || t.includes('glucose')) {
    return {
      emoji: '🩺',
      hint: 'Health check',
      duration: '5 mins',
      detail: 'Health Monitoring',
      tip: 'Sit calmly for 5 minutes before measuring. Place the cuff on your upper arm at heart level. Record the reading in your health log. Alert your caregiver if sistolic is above 140 or below 90.',
    };
  }

  // Default fallback
  return {
    emoji: '📋',
    hint: 'Daily task',
    duration: '15 mins',
    detail: title,
    tip: 'Complete this task as directed by your care team. If you have any questions or feel unwell, press the ! button below to alert your caregiver.',
  };
}

export const statusColors: Record<'done' | 'unsure' | 'missed', string> = {
  done: C.primary,
  unsure: C.unsureBg,
  missed: C.skipBg,
};
