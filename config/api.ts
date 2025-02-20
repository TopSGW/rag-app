// API configuration
export const BACKEND_URL = 'http://10.0.2.2:8000';
export const WEBSOCKET_URL = 'ws://10.0.2.2:8000';

// Function to get the appropriate URL based on the protocol
export const getApiUrl = (useWebSocket: boolean = false) => {
  return useWebSocket ? WEBSOCKET_URL : BACKEND_URL;
};