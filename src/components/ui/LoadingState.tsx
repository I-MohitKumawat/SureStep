import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export interface LoadingStateProps {
  message?: string;
  paddingVertical?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  paddingVertical = 26,
}) => (
  <View className="items-center" style={{ paddingVertical }}>
    <ActivityIndicator size="small" color="#0E7A67" />

    {!!message && (
      <Text className="mt-[10px] font-inter-regular text-[12px] text-care-muted">
        {message}
      </Text>
    )}
  </View>
);
