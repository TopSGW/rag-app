import React, { useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, View } from 'react-native';
import { Link } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { MaskedTextInput } from 'react-native-mask-text';
import { Ionicons } from '@expo/vector-icons';

export default function Page() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isBiometricSupported } = useAuth();

  const cleanPhoneNumber = useCallback((phone: string): string => {
    // Keep the + if it exists
    const hasPlus = phone.startsWith('+');
    // Remove all non-digit characters
    const cleaned = phone.replace(/[^\d]/g, '');
    // Add back the + if it existed
    return hasPlus ? `+${cleaned}` : cleaned;
  }, []);

  const handleLogin = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    // Clean the phone number before sending
    const cleanedPhone = cleanPhoneNumber(phoneNumber);
    if (cleanedPhone.length < 9 || cleanedPhone.length > 15) {
      Alert.alert('Error', 'Phone number must be between 9 and 15 digits');
      return;
    }

    try {
      setIsLoading(true);
      await login(cleanedPhone);
    } catch (error) {
      // Error is already handled in the auth context
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Image
        source={require('../../assets/images/react-logo.png')}
        style={styles.logo}
      />
      <ThemedText style={styles.title}>Welcome Back!</ThemedText>
      
      <View style={styles.inputContainer}>
        <MaskedTextInput
          style={styles.input}
          placeholder="+1 (999) 999-9999"
          placeholderTextColor="#666"
          value={phoneNumber}
          onChangeText={(masked: string) => setPhoneNumber(masked)}
          mask={'+1 (999) 999-9999'}
          keyboardType="phone-pad"
          editable={!isLoading}
        />
      </View>

      <View style={styles.infoContainer}>
        <Ionicons name="finger-print-outline" size={24} color="#007AFF" />
        <ThemedText style={styles.infoText}>
          Biometric verification will be required after phone number verification
        </ThemedText>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={isLoading || !phoneNumber.trim()}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="log-in-outline" size={24} color="#FFFFFF" />
            <ThemedText style={styles.buttonText}>Login</ThemedText>
          </>
        )}
      </TouchableOpacity>
      
      <Link href="/auth/signup" asChild>
        <TouchableOpacity style={styles.linkButton} disabled={isLoading}>
          <ThemedText style={styles.linkText}>
            Don't have an account? Sign up
          </ThemedText>
        </TouchableOpacity>
      </Link>

      {!isBiometricSupported && (
        <ThemedText style={styles.warningText}>
          Biometric authentication is required but not available on this device
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  input: {
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 15,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#007AFF',
  },
  warningText: {
    marginTop: 20,
    color: '#FF3B30',
    textAlign: 'center',
    fontSize: 14,
  },
});