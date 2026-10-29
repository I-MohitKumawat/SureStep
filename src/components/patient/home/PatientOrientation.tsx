import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../../theme/ThemeContext';

interface PatientOrientationProps {
  displayName: string;
  photoUrl?: string | null;
  hasNewMemories?: boolean;
  onPressProfile?: () => void;
}

export const PatientOrientation: React.FC<PatientOrientationProps> = ({
  displayName,
  photoUrl,
  hasNewMemories = false,
  onPressProfile,
}) => {
  const { mode } = useTheme();
  const [imageError, setImageError] = useState(false);

  // Dynamic greeting based on current local device hour
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 4 && hours < 12) return 'Good morning,';
    if (hours >= 12 && hours < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  // Formatted date (e.g., "Wednesday, October 28")
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const avatarSize = 70;
  const ringSize = avatarSize + 14;
  const radius = (ringSize - 4) / 2;
  const circumference = 2 * Math.PI * radius;

  const initials = displayName
    ? displayName
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'P';

  const isDark = mode === 'dark';

  return (
    <View className="flex-row items-center my-3.5 px-1">
      {/* Patient Photo with outer memory arc if available - tap navigates to settings */}
      <Pressable
        onPress={onPressProfile}
        disabled={!onPressProfile}
        accessibilityRole="button"
        accessibilityLabel="View settings and profile"
        style={({ pressed }) => [
          { width: ringSize, height: ringSize },
          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        ]}
        className="items-center justify-center mr-4"
      >
        {hasNewMemories && (
          <Svg
            width={ringSize}
            height={ringSize}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            {/* Approved memory status ring: elegant 270-degree arc in primary teal */}
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke="#0E7A67"
              strokeWidth={3}
              fill="none"
              strokeDasharray={`${circumference * 0.73} ${circumference * 0.27}`}
              strokeLinecap="round"
              rotation="105"
              origin={`${ringSize / 2}, ${ringSize / 2}`}
            />
          </Svg>
        )}

        <View
          style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
          className="items-center justify-center overflow-hidden border border-[#E5E0D8] dark:border-[#2C3835] bg-white dark:bg-[#1C2422]"
        >
          {photoUrl && !imageError ? (
            <Image
              source={{ uri: photoUrl }}
              style={{ width: avatarSize, height: avatarSize }}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View
              style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
              className="items-center justify-center bg-[#E6F4F1] dark:bg-[#16332D]"
            >
              <Text className="text-2xl font-bold text-[#0E7A67] dark:text-[#b1f3da]">
                {initials}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      {/* Greeting, Name, Date */}
      <View className="flex-1 justify-center">
        <Text
          className="text-base font-normal mb-0.5"
          style={{ color: isDark ? '#9EABA7' : '#52605D' }}
        >
          {getGreeting()}
        </Text>
        <Text
          className="text-[25px] font-extrabold tracking-tight leading-7 mb-0.5"
          style={{ color: isDark ? '#F5F7F6' : '#161E1C' }}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <Text
          className="text-sm font-medium"
          style={{ color: isDark ? '#9EABA7' : '#52605D' }}
        >
          {formattedDate}
        </Text>
      </View>
    </View>
  );
};
