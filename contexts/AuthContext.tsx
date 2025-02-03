import React, { createContext, useContext, useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

type AuthContextType = {
  isAuthenticated: boolean;
  loginWithBiometrics: (phoneNumber: string) => Promise<void>;
  signup: (phoneNumber: string) => Promise<void>;
  logout: () => void;
  isBiometricSupported: boolean;
  phoneNumber: string | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Check if running in development mode
const isTestEnvironment = __DEV__;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  // Check biometric support on component mount
  useEffect(() => {
    checkBiometricSupport();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/auth/login');
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
    try {
      // For development mode, show a confirmation dialog instead of actual biometric
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

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
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

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic phone number validation (can be enhanced based on your requirements)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const loginWithBiometrics = async (phone: string) => {
    if (!validatePhoneNumber(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (!isBiometricSupported && !isTestEnvironment) {
      Alert.alert('Error', 'Biometric authentication is not supported on this device');
      return;
    }

    const authenticated = await authenticateWithBiometrics();
    if (authenticated) {
      setPhoneNumber(phone);
      setIsAuthenticated(true);
    }
  };

  const signup = async (phone: string) => {
    if (!validatePhoneNumber(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    // Here you would typically make an API call to register the phone number
    // For now, we'll just simulate a successful signup
    console.log('Signing up with:', phone);
    setPhoneNumber(phone);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPhoneNumber(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        loginWithBiometrics, 
        signup, 
        logout,
        isBiometricSupported,
        phoneNumber
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