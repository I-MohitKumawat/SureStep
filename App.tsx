import 'react-native-gesture-handler';
import React from 'react';
// ── Migration Phase 13: App.tsx now mounts src/AppShell directly ──────────────
// Old entry: import AppShell from './app/App';  ← still available for rollback
import AppShell from './src/AppShell';

export default function App() {
  return <AppShell />;
}

