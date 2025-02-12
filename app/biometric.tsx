import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function BiometricScreen() {
  const { isAuthenticated, authenticate, isBiometricSupported } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/main');
    }
  }, [isAuthenticated]);

  const handleBiometricAuth = async () => {
    await authenticate();
  };

  if (!isBiometricSupported) {
    return (
      <View style={styles.container}>
        <Text>Biometric authentication is not supported on this device.</Text>
        <Button mode="contained" onPress={() => router.replace('/main')}>
          Continue without biometrics
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Biometric Authentication</Text>
      <Button mode="contained" onPress={handleBiometricAuth}>
        Authenticate
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});