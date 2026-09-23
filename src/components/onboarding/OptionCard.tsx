/**
 * SureStep — src/components/onboarding/OptionCard.tsx
 * Selectable card component for onboarding options.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

interface OptionCardProps {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  multiSelect?: boolean;
  badge?: string;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  title,
  description,
  icon,
  selected,
  onPress,
  multiSelect = false,
  badge,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        selected && s.cardSelected,
        pressed && s.cardPressed,
      ]}
    >
      {icon ? (
        <View style={[s.iconBox, selected && s.iconBoxSelected]}>
          <Ionicons
            name={icon}
            size={22}
            color={selected ? C.primary : C.textSecondary}
          />
        </View>
      ) : null}

      <View style={s.textWrapper}>
        <View style={s.titleRow}>
          <Text style={[s.title, selected && s.titleSelected]}>{title}</Text>
          {badge ? (
            <View style={s.badge}>
              <Text style={s.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {description ? <Text style={s.description}>{description}</Text> : null}
      </View>

      {multiSelect ? (
        <View style={[s.checkbox, selected && s.checkboxSelected]}>
          {selected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </View>
      ) : (
        <View style={[s.radioCircle, selected && s.radioCircleSelected]}>
          {selected && <View style={s.radioDot} />}
        </View>
      )}
    </Pressable>
  );
};

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 62,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 12,
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: C.primary,
    backgroundColor: '#F0FBF8',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: '#E0F5F0',
  },
  textWrapper: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: F.medium,
    fontSize: 15,
    color: C.textPrimary,
    lineHeight: 20,
  },
  titleSelected: {
    fontFamily: F.bold,
    color: C.textPrimary,
  },
  description: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  badgeText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.textSecondary,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
});
