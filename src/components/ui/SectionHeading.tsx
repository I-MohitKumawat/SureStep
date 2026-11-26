import React from 'react';
import { Text } from 'react-native';

export interface SectionHeadingProps {
  title: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ title }) => (
  <Text className="font-inter-bold text-[18px] leading-[24px] text-care-ink">
    {title}
  </Text>
);
