import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { useTheme } from '../../packages/ui/theme/ThemeProvider';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = () => {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.appName, { color: theme.colors.textPrimary }]}>SureStep</Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 12
  },
  appName: {
    fontSize: 20,
    fontWeight: '700'
  }
});

