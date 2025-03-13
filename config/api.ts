import Constants from 'expo-constants';

// API configuration
const DEV_BACKEND_URL = 'http://157.157.221.29:20747';
const PROD_BACKEND_URL = 'https://dbd0-213-192-2-103.ngrok-free.app'; // Change this to your production HTTPS URL
const DEV_WEBSOCKET_URL = 'ws://157.157.221.29:20747';
const PROD_WEBSOCKET_URL = 'wss://dbd0-213-192-2-103.ngrok-free.app'; // Change this to your production WSS URL

const isProduction = !__DEV__;

export const BACKEND_URL = isProduction ? PROD_BACKEND_URL : DEV_BACKEND_URL;
export const WEBSOCKET_URL = isProduction ? PROD_WEBSOCKET_URL : DEV_WEBSOCKET_URL;

// Function to get the appropriate URL based on the protocol
export const getApiUrl = (useWebSocket: boolean = false) => {
  return useWebSocket ? WEBSOCKET_URL : BACKEND_URL;
};