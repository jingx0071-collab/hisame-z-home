import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hisame.zhome',
  appName: 'Z',
  webDir: 'public',

  server: {
    url: 'https://hisame-z-home.vercel.app',
    cleartext: false,
  },

  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },

  ios: {
    contentInset: 'never',
    backgroundColor: '#f4ede0',
    scrollEnabled: false,
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config;
