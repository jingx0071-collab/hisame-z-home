import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hisame.zhome',
  appName: 'Z',
  webDir: 'public',

  server: {
    url: 'https://hisame-z-home.vercel.app',
    cleartext: false,
  },

  ios: {
    // automatic：WebView 自己避开刘海和 home indicator
    contentInset: 'never',
    backgroundColor: '#f4ede0',
    scrollEnabled: false,
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config;
