import type { AppRouter } from '@allotech/api';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getSessionToken } from './auth-storage';

export const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const localhost = hostUri.split(':')[0];
    return `http://${localhost}:3000`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://127.0.0.1:3000';
};

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      async headers() {
        const token = await getSessionToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
