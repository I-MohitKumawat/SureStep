import React from 'react';
import { ActivityIndicator } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';

/** Shown while profile data is loading; uses full safe-area insets (no stack header). */
export const ProfileLoadingScreen: React.FC = () => {
  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <ActivityIndicator />
    </ScreenContainer>
  );
};
