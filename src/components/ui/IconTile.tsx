import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface IconTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  background?: string;
  size?: number;
}

export const IconTile: React.FC<IconTileProps> = ({
  icon,
  color = '#256C78',
  background = '#E1F2F4',
  size = 40,
}) => (
  <View
    className="items-center justify-center rounded-[12px]"
    style={{
      width: size,
      height: size,
      backgroundColor: background,
    }}
  >
    <Ionicons name={icon} size={size * 0.52} color={color} />
  </View>
);
