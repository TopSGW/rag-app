import React, { createContext, useContext, useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';
import UserService from '../services/userService';
import { User } from '../types/user';

type AuthContextType = {
  isAuthenticated: boolean;
  login: (phoneNumber: string) => Promise<void>;
  signup: (phoneNumber: string) => Promise<void>;
  logout: () => void;
  isBiometricSupported: boolean;
  phoneNumber: string | null;
  user: User | null;
};

const AuthContext = createContext<AuthContextType | null>(null);
const userService = new UserService();

// Check if running in development mode
const isTestEnvironment = __DEV__;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

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

  const login = async (phone: string) => {
    try {
      // Step 1: Validate phone number and check user existence
      await userService.validatePhoneNumber(phone);
      let userResponse;
      
      try {
        userResponse = await userService.loginUser({ phone_number: phone });
      } catch (error) {
        if (error instanceof Error && error.message.includes('User not found')) {
          Alert.alert('Error', 'User not found. Please register first.');
        } else {
          throw error;
        }
        return;
      }

      // Step 2: If user exists, require biometric authentication
      if (!isBiometricSupported && !isTestEnvironment) {
        Alert.alert('Error', 'Biometric authentication is required but not supported on this device');
        return;
      }

      const authenticated = await authenticateWithBiometrics();
      if (!authenticated) {
        Alert.alert('Error', 'Biometric authentication failed. Please try again.');
        return;
      }

      // Step 3: Complete login after successful biometric auth
      setPhoneNumber(phone);
      setUser({
        id: userResponse.id,
        phone_number: userResponse.phone_number
      });
      setIsAuthenticated(true);
    } catch (error) {
      let errorMessage = 'Failed to login. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Invalid phone number format')) {
          errorMessage = 'Invalid phone number format. Must be between 9 and 15 digits.';
        }
      }
      Alert.alert('Error', errorMessage);
      throw error;
    }
  };

  const signup = async (phone: string) => {
    try {
      // Step 1: Validate phone number
      await userService.validatePhoneNumber(phone);

      // Step 2: Require biometric setup
      if (!isBiometricSupported && !isTestEnvironment) {
        Alert.alert('Error', 'Biometric authentication is required but not supported on this device');
        return;
      }

      const authenticated = await authenticateWithBiometrics();
      if (!authenticated) {
        Alert.alert('Error', 'Biometric authentication failed. Please try again.');
        return;
      }

      // Step 3: Register user after successful biometric auth
      const userResponse = await userService.registerUser({ phone_number: phone });
      setPhoneNumber(phone);
      setUser({
        id: userResponse.id,
        phone_number: userResponse.phone_number
      });
      setIsAuthenticated(true);
    } catch (error) {
      let errorMessage = 'Failed to register. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Invalid phone number format')) {
          errorMessage = 'Invalid phone number format. Must be between 9 and 15 digits.';
        } else if (error.message.includes('Phone number already registered')) {
          errorMessage = 'This phone number is already registered. Please try logging in.';
        }
      }
      Alert.alert('Error', errorMessage);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPhoneNumber(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated,
        login,
        signup, 
        logout,
        isBiometricSupported,
        phoneNumber,
        user
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