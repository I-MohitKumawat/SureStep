import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'PatientDetail'>;

export const PatientDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patientId, name } = route.params;

  return (
    <ScreenContainer>
      <Text style={styles.heading}>{name}</Text>

      <View style={styles.actionsSection}>
        <Button
          title="Manage routines"
          onPress={() => navigation.navigate('RoutineManager', { patientId, patientName: name })}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  actionsSection: {
    marginTop: 24
  }
});

