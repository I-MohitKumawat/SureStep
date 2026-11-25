import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OptionCardProps {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  multiSelect?: boolean;
  badge?: string;
}

export const OptionCard: React.FC<OptionCardProps> = ({ title, description, icon, selected, onPress, multiSelect = false, badge }) => (
  <Pressable onPress={onPress} accessibilityRole={multiSelect ? 'checkbox' : 'radio'} accessibilityState={{ checked: selected }} accessibilityLabel={[title, description, badge].filter(Boolean).join(', ')} className={`mb-[10px] min-h-[64px] w-full flex-row items-center gap-[12px] rounded-[16px] border px-[14px] py-[10px] active:opacity-80 ${selected ? 'border-brand bg-care-selected' : 'border-care-border bg-white'}`} style={selected ? undefined : { shadowColor: '#182B25', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 1 }}>
    {!!icon && <View className={`h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[12px] ${selected ? 'bg-[#D6F0E7]' : 'bg-[#F1F4F3]'}`}><Ionicons name={icon} size={19} color={selected ? '#0E7A67' : '#52605D'} /></View>}
    <View className="min-w-0 flex-1">
      <View className="flex-row flex-wrap items-center gap-[6px]">
        <Text className={`shrink text-[15px] leading-[20px] text-care-ink ${selected ? 'font-inter-semibold' : 'font-inter-medium'}`}>{title}</Text>
        {!!badge && <View className="rounded-full bg-brand-tint px-[8px] py-[2px]"><Text className="font-inter-semibold text-[11px] text-brand-dark">{badge}</Text></View>}
      </View>
      {!!description && <Text className="mt-[3px] font-inter-regular text-[13px] leading-[18px] text-care-muted">{description}</Text>}
    </View>
    <View className={`h-[20px] w-[20px] shrink-0 items-center justify-center border-[1.5px] ${multiSelect ? 'rounded-[6px]' : 'rounded-full'} ${selected ? 'border-brand bg-brand' : 'border-[#CBD8D3] bg-white'}`}>
      {selected && <Ionicons name="checkmark" size={13} color="white" />}
    </View>
  </Pressable>
);
export default OptionCard;
