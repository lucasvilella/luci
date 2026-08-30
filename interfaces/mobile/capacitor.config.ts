import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.luci.assistant',
  appName: 'Luci',
  webDir: 'out',
  server: {
    cleartext: true,
    androidScheme: 'http',
    hostname: 'localhost'
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
