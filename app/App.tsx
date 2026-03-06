import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { HomeScreen } from './screens/HomeScreen';

const App: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>SureStep</Text>
        <Text style={styles.subtitle}>Cross-platform mobile app shell</Text>
      </View>
      <View style={styles.content}>
        <HomeScreen />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fb'
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827'
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280'
  },
  content: {
    flex: 1
  }
});

export default App;

