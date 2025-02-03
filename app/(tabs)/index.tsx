import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { phoneNumber } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={60} color="#007AFF" />
        <ThemedText style={styles.title}>Welcome!</ThemedText>
        <ThemedText style={styles.subtitle}>You're securely logged in</ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="phone-portrait" size={24} color="#007AFF" />
            <ThemedText style={styles.cardTitle}>Your Phone Number</ThemedText>
          </View>
          <ThemedText style={styles.phoneNumber}>{phoneNumber}</ThemedText>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="finger-print" size={24} color="#007AFF" />
            <ThemedText style={styles.cardTitle}>Security Status</ThemedText>
          </View>
          <View style={styles.securityItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <ThemedText style={styles.securityText}>
              Biometric Authentication Active
            </ThemedText>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={24} color="#007AFF" />
            <ThemedText style={styles.cardTitle}>Quick Tips</ThemedText>
          </View>
          <ThemedText style={styles.tipText}>
            Visit the Profile tab to manage your account settings and security preferences.
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  phoneNumber: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  securityText: {
    fontSize: 16,
    color: '#333',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});