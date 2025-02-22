// API configuration
export const BACKEND_URL = 'http://213.192.2.103:40114';
export const WEBSOCKET_URL = 'ws://213.192.2.103:40114';

// Function to get the appropriate URL based on the protocol
export const getApiUrl = (useWebSocket: boolean = false) => {
  return useWebSocket ? WEBSOCKET_URL : BACKEND_URL;
};