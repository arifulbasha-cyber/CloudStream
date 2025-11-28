import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cloudstream.explorer',
  appName: 'CloudStream',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'localhost',
    allowNavigation: [
      "accounts.google.com",
      "drive.google.com",
      "*.googleapis.com"
    ]
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email", "https://www.googleapis.com/auth/drive.readonly"],
      // PASTE YOUR NEW ANDROID CLIENT ID HERE AFTER GENERATING IT IN CONSOLE
      clientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com", 
      forceCodeForRefreshToken: true
    }
  }
};

export default config;