import React, { createContext, useContext, useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

type AuthContextType = {
  isAuthenticated: boolean;
  authenticate: () => Promise<void>;
  logout: () => void;
  isBiometricSupported: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Check if running in development mode
const isTestEnvironment = __DEV__;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  // Check biometric support on component mount
  useEffect(() => {
    checkBiometricSupport();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/main');
    } else {
      router.replace('/biometric');
    }
  }, [isAuthenticated]);

  const checkBiometricSupport = async () => {
    try {
      // Always return true for development mode to enable testing
      if (isTestEnvironment) {
        setIsBiometricSupported(true);
        return;
      }

      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
    } catch (error) {
      console.error('Error checking biometric support:', error);
      setIsBiometricSupported(false);
    }
  };

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    if (isTestEnvironment) {
      return new Promise((resolve) => {
        Alert.alert(
          'Development Mode',
          'This is a simulated biometric authentication. Would you like to authenticate?',
          [
            {
              text: 'Cancel',
              onPress: () => resolve(false),
              style: 'cancel',
            },
            {
              text: 'Authenticate',
              onPress: () => resolve(true),
            },
          ]
        );
      });
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Error', 'Failed to authenticate. Please try again.');
      return false;
    }
  };

  const authenticate = async () => {
    if (!isBiometricSupported && !isTestEnvironment) {
      Alert.alert('Error', 'Biometric authentication is not supported on this device');
      return;
    }

    const authenticated = await authenticateWithBiometrics();
    if (authenticated) {
      setIsAuthenticated(true);
    } else {
      Alert.alert('Error', 'Biometric authentication failed. Please try again.');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated,
        authenticate,
        logout,
        isBiometricSupported,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}