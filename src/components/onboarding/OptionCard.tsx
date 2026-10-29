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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    gap: 12,
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: '#0E7A67',
    borderWidth: 2,
    backgroundColor: '#F0FBF8',
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  iconBoxSelected: {
    backgroundColor: '#E6F4F1',
    borderColor: '#C2E8E0',
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
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#161E1C',
    lineHeight: 21,
  },
  titleSelected: {
    fontFamily: F.bold,
    color: '#084C41',
  },
  description: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    lineHeight: 18,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
  },
  badgeText: {
    fontFamily: F.semiBold,
    fontSize: 11,
    color: '#0A5D50',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D6DDDD',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioCircleSelected: {
    borderColor: '#0E7A67',
    backgroundColor: '#0E7A67',
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
    borderColor: '#D6DDDD',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    borderColor: '#0E7A67',
    backgroundColor: '#0E7A67',
  },
});
