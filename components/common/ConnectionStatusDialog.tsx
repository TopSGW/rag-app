import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useWebSocket } from '@/contexts/WebSocketContext';

const ConnectionStatusDialog: React.FC = () => {
  const { connectionStatus } = useWebSocket();

  if (connectionStatus !== 'disconnected') {
    return null;
  }

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={true}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Server Connection Failed</Text>
          <Text style={styles.descriptionText}>
            We're having trouble connecting to the server. Please check your internet connection and try again.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              // You can add a retry logic here if needed
              console.log('Retry connection');
            }}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  descriptionText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ConnectionStatusDialog;