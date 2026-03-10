import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { useTheme } from '../../packages/ui/theme/ThemeProvider';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>Home</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
        This is the initial SureStep mobile app shell. Navigation, roles, and feature modules will
        be wired in future tasks.
      </Text>

      <View style={styles.buttonGroup}>
        <Button title="Go to details" onPress={() => navigation.navigate('Details')} />
      </View>

      <View style={styles.buttonGroup}>
        <Button
          title="Open caregiver dashboard"
          onPress={() => navigation.navigate('CaregiverDashboard')}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#111827'
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
    marginBottom: 16
  },
  buttonGroup: {
    marginBottom: 8
  }
});

