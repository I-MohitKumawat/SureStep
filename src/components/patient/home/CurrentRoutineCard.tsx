import React from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../../theme/ThemeContext';

export interface RoutineOccurrence {
  id: string;
  routine_id: string;
  patient_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  title: string;
  category: string;
  description?: string | null;
  photo_url?: string | null;
  instructions_md?: string | null;
  completed_by?: string | null;
  signed_off_at?: string | null;
}

interface CurrentRoutineCardProps {
  occurrence: RoutineOccurrence | null;
  onComplete: (occurrenceId: string) => Promise<void>;
  onAskForHelp: (occurrence: RoutineOccurrence) => void;
  isSubmitting?: boolean;
}

const ClockIcon = ({ color = '#52605D', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 7v5l3 3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckCircleIcon = ({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
    <Path d="M8 12l3 3 5-5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UserHelpIcon = ({ color = '#161E1C', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CurrentRoutineCard: React.FC<CurrentRoutineCardProps> = ({
  occurrence,
  onComplete,
  onAskForHelp,
  isSubmitting = false,
}) => {
  const { mode } = useTheme();
  const [imageError, setImageError] = React.useState(false);

  if (!occurrence) {
    return (
      <View className="rounded-[28px] p-6 my-2 border border-[#E5E0D8] dark:border-[#2C3835] bg-white dark:bg-[#1C2422]">
        <Text
          className="text-center font-medium text-base"
          style={{ color: mode === 'dark' ? '#9EABA7' : '#52605D' }}
        >
          No pending routine scheduled for right now.
        </Text>
      </View>
    );
  }

  // Parse time for friendly display (e.g. 08:00:00 -> 8:00 AM)
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    }
    return timeStr;
  };

  // Derive category tag (e.g., Morning, Medication)
  const categoryTag =
    occurrence.category === 'MEDICATION'
      ? 'Morning'
      : occurrence.category.charAt(0) + occurrence.category.slice(1).toLowerCase();

  // Extract visual instruction preview & photo from routine configuration
  let previewText = occurrence.description || '';
  let photoUrl = occurrence.photo_url || null;

  // Check if instructions_md or description has JSON steps
  const rawInstructions = occurrence.instructions_md || occurrence.description;
  if (rawInstructions && rawInstructions.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(rawInstructions);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!previewText && parsed[0].text) {
          previewText = parsed[0].text;
        }
        if (!photoUrl && parsed[0].photo_url) {
          photoUrl = parsed[0].photo_url;
        }
      }
    } catch {
      // Keep plain text fallback
    }
  }

  const isCompleted = occurrence.status === 'COMPLETED';
  const isDark = mode === 'dark';

  return (
    <View
      className="rounded-[28px] p-5 my-2 border shadow-sm border-[#E5E0D8] dark:border-[#2C3835] bg-white dark:bg-[#1C2422]"
    >
      {/* Top Details & Optional Photo */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          {/* Category / Time of day pill */}
          <View className="self-start px-3 py-1 rounded-full bg-[#E6F4F1] dark:bg-[#16332D] mb-2">
            <Text className="text-xs font-bold text-[#0E7A67] dark:text-[#b1f3da]">
              {categoryTag}
            </Text>
          </View>

          {/* Routine Title */}
          <Text
            className="text-[22px] font-extrabold leading-7 tracking-tight mb-2"
            style={{ color: isDark ? '#F5F7F6' : '#161E1C' }}
            numberOfLines={2}
          >
            {occurrence.title}
          </Text>

          {/* Time row */}
          <View className="flex-row items-center mb-2">
            <ClockIcon color={isDark ? '#9EABA7' : '#52605D'} size={15} />
            <Text
              className="text-sm font-semibold ml-1.5"
              style={{ color: isDark ? '#9EABA7' : '#52605D' }}
            >
              {formatTime(occurrence.scheduled_time)}
            </Text>
          </View>

          {/* Instruction preview */}
          {!!previewText && (
            <Text
              className="text-sm leading-5"
              style={{ color: isDark ? '#9EABA7' : '#52605D' }}
              numberOfLines={2}
            >
              {previewText}
            </Text>
          )}
        </View>

        {/* Routine Image Thumbnail (rendered if configured and loaded) */}
        {!!photoUrl && !imageError && (
          <View className="w-28 h-28 rounded-2xl overflow-hidden border border-[#E5E0D8] dark:border-[#2C3835] bg-[#FAF8F5] dark:bg-[#121816]">
            <Image
              source={{ uri: photoUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          </View>
        )}
      </View>

      {/* Action Buttons Row */}
      <View className="flex-row items-center gap-3 mt-5">
        {/* I'VE DONE THIS */}
        <Pressable
          onPress={() => !isCompleted && onComplete(occurrence.id)}
          disabled={isCompleted || isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="I've done this"
          className="flex-[1.5] flex-row items-center justify-center py-3.5 px-4 rounded-2xl shadow-sm"
          style={({ pressed }) => [
            {
              backgroundColor: isCompleted ? '#065F46' : '#0E7A67',
              opacity: isCompleted ? 0.9 : pressed ? 0.85 : 1,
            },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <CheckCircleIcon color="#FFFFFF" size={19} />
              <Text className="text-white font-extrabold text-[13px] ml-2 tracking-wider uppercase">
                {isCompleted ? 'COMPLETED' : "I'VE DONE THIS"}
              </Text>
            </>
          )}
        </Pressable>

        {/* Ask for Help */}
        <Pressable
          onPress={() => onAskForHelp(occurrence)}
          accessibilityRole="button"
          accessibilityLabel="Ask for help"
          className="flex-1 flex-row items-center justify-center py-3.5 px-3 rounded-2xl border border-[#E5E0D8] dark:border-[#2C3835] bg-white dark:bg-[#1C2422]"
          style={({ pressed }) => [pressed && { opacity: 0.75 }]}
        >
          <UserHelpIcon color={isDark ? '#F5F7F6' : '#161E1C'} size={18} />
          <Text
            className="font-bold text-sm ml-2 tracking-tight"
            style={{ color: isDark ? '#F5F7F6' : '#161E1C' }}
          >
            Ask for Help
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
