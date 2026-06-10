import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[MapErrorBoundary] caught rendering error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>🗺️</Text>
          <Text style={styles.title}>Map Loading Error</Text>
          <Text style={styles.message}>
            Could not initialize the map. This may be due to missing configuration, internet connection issues, or Google Maps API key requirements.
          </Text>
          {this.state.error && (
            <Text style={styles.errorDetails}>
              {this.state.error.message || String(this.state.error)}
            </Text>
          )}
          <Pressable style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    margin: 16,
    minHeight: 260,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 6,
  },
  message: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  errorDetails: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    width: '100%',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
