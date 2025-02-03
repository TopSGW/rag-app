import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, View } from 'react-native';
import { Link } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { MaskedTextInput } from 'react-native-mask-text';
import { Ionicons } from '@expo/vector-icons';

const SignupScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();

  const handleSignup = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    try {
      setIsLoading(true);
      await signup(phoneNumber);
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
      console.error('Signup error:', error);
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
      <ThemedText style={styles.title}>Create Account</ThemedText>
      
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
        <View style={styles.iconContainer}>
          <Ionicons name="phone-portrait-outline" size={24} color="#007AFF" />
        </View>
      </View>

      <ThemedText style={styles.infoText}>
        You'll receive a verification code on this number
      </ThemedText>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleSignup}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="person-add-outline" size={24} color="#FFFFFF" />
            <ThemedText style={styles.buttonText}>Sign Up</ThemedText>
          </>
        )}
      </TouchableOpacity>
      
      <Link href="/auth/login" asChild>
        <TouchableOpacity style={styles.linkButton} disabled={isLoading}>
          <ThemedText style={styles.linkText}>
            Already have an account? Login
          </ThemedText>
        </TouchableOpacity>
      </Link>
    </ThemedView>
  );
};

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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
  },
  iconContainer: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
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
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default SignupScreen;