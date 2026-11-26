import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface PatientSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}

export const PatientSearchBar: React.FC<PatientSearchBarProps> = ({
  value,
  onChangeText,
  onClear,
}) => (
  <View className="min-h-[48px] flex-row items-center gap-[10px] rounded-[12px] border border-care-border bg-white px-[12px]">
    <Ionicons name="search-outline" size={19} color="#68766F" />

    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder="Search by name or phone"
      placeholderTextColor="#68766F"
      autoFocus
      autoCorrect={false}
      accessibilityLabel="Search patients"
      className="min-h-[48px] flex-1 font-inter-regular text-[14px] text-care-ink"
    />

    {!!value && (
      <Pressable
        onPress={onClear}
        accessibilityRole="button"
        accessibilityLabel="Clear search"
        className="h-[44px] w-[36px] items-center justify-center"
      >
        <Ionicons name="close-circle-outline" size={20} color="#68766F" />
      </Pressable>
    )}
  </View>
);
