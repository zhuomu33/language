import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.daily.page.language',
  appName: '每日一页',
  webDir: 'release',
  ios: {
    contentInset: 'never',
    scrollEnabled: false
  }
};

export default config;
