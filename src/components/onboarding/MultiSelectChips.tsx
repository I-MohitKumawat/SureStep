/**
 * SureStep — src/components/onboarding/MultiSelectChips.tsx
 * Reusable pill chip group for quick, tactile multi-selection.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
          <TouchableOpacity
            key={opt.id}
            onPress={() => onToggle(opt.id)}
            activeOpacity={0.8}
            style={[
              s.chip,
              isSelected && s.chipSelected,
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
          </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
  },
  chipSelected: {
    backgroundColor: '#0E7A67',
    borderColor: '#0E7A67',
  },
  chipPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  chipText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#161E1C',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontFamily: F.bold,
  },
});
