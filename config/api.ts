// API configuration
export const BACKEND_URL = 'https://566f-38-32-68-195.ngrok-free.app';
export const WEBSOCKET_URL = 'wss://566f-38-32-68-195.ngrok-free.app';

// Function to get the appropriate URL based on the protocol
export const getApiUrl = (useWebSocket: boolean = false) => {
  return useWebSocket ? WEBSOCKET_URL : BACKEND_URL;
};