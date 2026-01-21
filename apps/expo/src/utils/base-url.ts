import Constants from "expo-constants";

/**
 * Get the base URL for API requests.
 *
 * Priority order:
 * 1. EXPO_PUBLIC_API_URL environment variable (for localtunnel/production)
 * 2. Auto-detected local IP (for local development)
 *
 * To use localtunnel or a custom server, set EXPO_PUBLIC_API_URL in your .env:
 * EXPO_PUBLIC_API_URL=https://your-tunnel.loca.lt
 */
export const getBaseUrl = () => {
  // Check for explicit API URL configuration (production, localtunnel, etc.)
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (configuredUrl) {
    return configuredUrl;
  }

  /**
   * Development fallback: Auto-detect local IP from Expo debugger
   * Gets the IP address of your host-machine. If it cannot automatically find it,
   * you'll have to manually set it. NOTE: Port 3000 should work for most but confirm
   * you don't have anything else running on it, or you'd have to change it.
   */
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(":")[0];

  if (!localhost) {
    throw new Error(
      "Failed to get localhost. Please set EXPO_PUBLIC_API_URL in your .env file.\n" +
      "For local development, ensure Expo dev server is running.\n" +
      "For localtunnel, set: EXPO_PUBLIC_API_URL=https://your-tunnel.loca.lt"
    );
  }
  return `http://${localhost}:3000`;
};
