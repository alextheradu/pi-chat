import type { CapacitorConfig } from '@capacitor/cli'

const appId   = process.env.MOBILE_APP_ID  ?? 'com.example.teamchat'
const appName = process.env.APP_NAME       ?? 'TeamChat'

const config: CapacitorConfig = {
  appId,
  appName,
  webDir: 'www',
  plugins: {
    GoogleAuth: {
      scopes:                   ['profile', 'email'],
      serverClientId:           process.env.GOOGLE_CLIENT_ID ?? '',
      forceCodeForRefreshToken: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style:           'dark',
      backgroundColor: '#0a0a0a',
    },
  },
}

export default config
