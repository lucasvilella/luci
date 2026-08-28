import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.luci.assistant',
  appName: 'Luci',
  webDir: 'out',
  server: {
    url: 'http://192.168.68.138:5173',
    cleartext: true,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    // Configurações adicionais de plugins nativos
  }
};

export default config;
