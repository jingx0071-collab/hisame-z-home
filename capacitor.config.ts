import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hisame.zhome',
  appName: 'Z',
  webDir: 'public',

  // 内容仍然走 Vercel —— git push 之后 App 打开就是新的，不用重装
  server: {
    url: 'https://hisame-z-home.vercel.app',
    cleartext: false,
  },

  ios: {
    contentInset: 'never',
    backgroundColor: '#1a1620',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config;
