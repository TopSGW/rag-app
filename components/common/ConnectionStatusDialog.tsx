import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useWebSocket } from '@/contexts/WebSocketContext';

const ConnectionStatusDialog: React.FC = () => {
  const { connectionStatus, connectionError, initializeWebSockets } = useWebSocket();
  const [showStatus, setShowStatus] = useState(false);
  const [statusOpacity] = useState(new Animated.Value(0));
  const [dotOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (connectionStatus !== 'connected') {
      setShowStatus(true);
      Animated.timing(statusOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      timeout = setTimeout(() => {
        Animated.timing(statusOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowStatus(false));
      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [connectionStatus, statusOpacity]);

  useEffect(() => {
    if (connectionStatus === 'connecting') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      dotOpacity.setValue(0);
    }
  }, [connectionStatus, dotOpacity]);

  const getStatusMessage = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected to server';
      case 'disconnected':
        return 'Disconnected from server';
      case 'connecting':
        return 'Connecting to server';
      case 'error':
        // Check if the error is an Auth WebSocket error
        if (connectionError && connectionError.includes('Auth WebSocket error')) {
          return 'Connection error occurred';
        }
        return connectionError || 'An error occurred';
      default:
        return 'Unknown connection status';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#4CAF50';
      case 'disconnected':
        return '#FFA000';
      case 'connecting':
        return '#2196F3';
      case 'error':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  if (!showStatus) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: statusOpacity }]}>
      <View style={[styles.statusBar, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusText}>{getStatusMessage()}</Text>
        {connectionStatus === 'connecting' && (
          <Animated.Text style={[styles.dot, { opacity: dotOpacity }]}>.</Animated.Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dot: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 5,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ConnectionStatusDialog;