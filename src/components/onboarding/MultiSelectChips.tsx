/**
 * SureStep — src/components/onboarding/MultiSelectChips.tsx
 * Reusable pill chip group for quick, tactile multi-selection.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

export interface ChipOption {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  description?: string;
}

interface MultiSelectChipsProps {
  options: ChipOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  allowMultiple?: boolean;
}

export const MultiSelectChips: React.FC<MultiSelectChipsProps> = ({
  options,
  selectedIds,
  onToggle,
  allowMultiple = true,
}) => {
  return (
    <View style={s.container}>
      {options.map((opt) => {
        const isSelected = selectedIds.includes(opt.id);
        return (
          <Pressable
            key={opt.id}
            onPress={() => onToggle(opt.id)}
            style={({ pressed }) => [
              s.chip,
              isSelected && s.chipSelected,
              pressed && s.chipPressed,
            ]}
          >
            {opt.icon ? (
              <Ionicons
                name={opt.icon}
                size={16}
                color={isSelected ? '#FFFFFF' : C.primary}
                style={{ marginRight: 6 }}
              />
            ) : null}
            <Text style={[s.chipText, isSelected && s.chipTextSelected]}>
              {opt.label}
            </Text>
            {isSelected ? (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#FFFFFF"
                style={{ marginLeft: 6 }}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  chipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  chipText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#374151',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontFamily: F.bold,
  },
});
