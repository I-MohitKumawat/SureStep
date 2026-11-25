
import React, { useState, useEffect } from 'react';
import {
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../../theme/ThemeContext';

interface PatientOrientationProps {
  displayName: string;
  photoUrl?: string | null;
  hasNewMemories?: boolean;
  onPressProfile?: () => void;
}

export const PatientOrientation: React.FC<
  PatientOrientationProps
> = ({
  displayName,
  photoUrl,
  hasNewMemories = false,
  onPressProfile,
}) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [photoUrl]);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // Dynamic greeting
  const hours = now.getHours();

  const greeting =
    hours >= 4 && hours < 12
      ? 'Good morning'
      : hours >= 12 && hours < 17
        ? 'Good afternoon'
        : 'Good evening';

  const greetingIcon =
    hours >= 4 && hours < 12
      ? 'sunny-outline'
      : hours >= 12 && hours < 17
        ? 'partly-sunny-outline'
        : 'moon-outline';

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const initials =
    displayName
      ?.trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'P';

  // Memory ring configuration
  const ringSize = 84;
  const radius = 39;
  const circumference = 2 * Math.PI * radius;

  const primaryColor = isDark ? '#6EE7B7' : '#0E7A67';
  const mutedColor = isDark ? '#A6BDB2' : '#64748B';

  return (
    <View
      className={`my-4 overflow-hidden rounded-3xl border p-5 ${
        isDark
          ? 'border-[#30453B] bg-[#1B2924]'
          : 'border-[#DFE9E4] bg-white'
      }`}
    >
      {/* Header */}
      <View className="mb-5 flex-row items-center justify-between">

        <View className="flex-1 flex-row items-center">
          <View
            className={`mr-2 h-9 w-9 items-center justify-center rounded-xl ${
              isDark ? 'bg-[#3B3520]' : 'bg-amber-50'
            }`}
          >
            <Ionicons
              name={greetingIcon}
              size={20}
              color={isDark ? '#FCD34D' : '#B7791F'}
            />
          </View>

          <Text
            className={`flex-shrink text-sm font-semibold ${
              isDark
                ? 'text-[#A6BDB2]'
                : 'text-slate-500'
            }`}
          >
            {greeting}
          </Text>
        </View>

        {/* Settings button */}
        {onPressProfile && (
          <Pressable
            onPress={onPressProfile}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            className={`h-11 w-11 items-center justify-center rounded-2xl active:opacity-70 ${
              isDark
                ? 'bg-[#263A31]'
                : 'bg-[#F0F5F2]'
            }`}
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color={mutedColor}
            />
          </Pressable>
        )}
      </View>

      {/* Profile section */}
      <View className="flex-row items-center">

        <Pressable
          onPress={onPressProfile}
          disabled={!onPressProfile}
          accessibilityRole="button"
          accessibilityLabel="View settings and profile"
          className="relative mr-4 h-[84px] w-[84px] items-center justify-center active:opacity-80"
        >
          {/* Memory status ring */}
          {hasNewMemories && (
            <View
              pointerEvents="none"
              className="absolute inset-0"
            >
              <Svg width={ringSize} height={ringSize}>

                {/* Ring track */}
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke={isDark ? '#30453B' : '#E1ECE6'}
                  strokeWidth={3}
                  fill="none"
                />

                {/* Active memory arc */}
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke={primaryColor}
                  strokeWidth={3}
                  fill="none"
                  strokeDasharray={[
                    circumference * 0.75,
                    circumference * 0.25,
                  ]}
                  strokeLinecap="round"
                  rotation={-90}
                  originX={ringSize / 2}
                  originY={ringSize / 2}
                />
              </Svg>
            </View>
          )}

          {/* Profile avatar */}
          <View
            className={`h-[70px] w-[70px] items-center justify-center overflow-hidden rounded-full border ${
              isDark
                ? 'border-[#3D5A4D] bg-[#234B3C]'
                : 'border-[#D1E9DD] bg-[#DFF4E9]'
            }`}
          >
            {photoUrl && !imageError ? (
              <Image
                source={{ uri: photoUrl }}
                className="h-full w-full"
                resizeMode="cover"
                onError={() => setImageError(true)}
                accessibilityLabel="Profile photo"
              />
            ) : (
              <Text
                className={`text-2xl font-bold ${
                  isDark
                    ? 'text-emerald-200'
                    : 'text-[#0E6650]'
                }`}
              >
                {initials}
              </Text>
            )}
          </View>
        </Pressable>

        {/* Patient information */}
        <View className="flex-1">

          <Text
            className={`text-[27px] font-bold leading-9 tracking-tight ${
              isDark
                ? 'text-[#F0FDF4]'
                : 'text-[#152D24]'
            }`}
            numberOfLines={2}
          >
            {displayName?.trim() || 'Patient'}
          </Text>

          <Text
            className={`mt-1 text-base font-medium ${
              isDark
                ? 'text-[#A6BDB2]'
                : 'text-slate-500'
            }`}
          >
            Welcome back!
          </Text>

        </View>
      </View>

      {/* Divider */}
      <View
        className={`my-5 h-px ${
          isDark ? 'bg-[#30453B]' : 'bg-[#E8EFEB]'
        }`}
      />

      {/* Current date */}
      <View className="flex-row items-center">
        <View
          className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${
            isDark
              ? 'bg-[#203E32]'
              : 'bg-[#E8F6EF]'
          }`}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={primaryColor}
          />
        </View>

        <View className="flex-1">
          <Text
            className={`mb-0.5 text-xs font-semibold uppercase tracking-wider ${
              isDark
                ? 'text-[#A6BDB2]'
                : 'text-slate-500'
            }`}
          >
            Today
          </Text>

          <Text
            className={`text-[15px] font-semibold ${
              isDark
                ? 'text-[#E5F2EA]'
                : 'text-[#243B31]'
            }`}
          >
            {formattedDate}
          </Text>
        </View>
      </View>

      {/* New memories notification */}
      {hasNewMemories && (
        <View
          className={`mt-4 flex-row items-center rounded-2xl px-3.5 py-3 ${
            isDark
              ? 'bg-[#203E32]'
              : 'bg-[#E8F6EF]'
          }`}
        >
          <Ionicons
            name="sparkles-outline"
            size={20}
            color={primaryColor}
          />

          <Text
            className={`ml-2.5 flex-1 text-sm font-semibold ${
              isDark
                ? 'text-emerald-200'
                : 'text-[#0E6650]'
            }`}
          >
            You have new memories
          </Text>

          <View
            className={`h-2 w-2 rounded-full ${
              isDark
                ? 'bg-emerald-300'
                : 'bg-emerald-600'
            }`}
          />
        </View>
      )}
    </View>
  );
};
