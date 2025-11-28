import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cloudstream.explorer',
  appName: 'CloudStream',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      "accounts.google.com",
      "drive.google.com",
      "*.googleapis.com"
    ]
  }
};

export default config;