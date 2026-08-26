import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.luci.assistant',
  appName: 'Luci',
  webDir: 'out',
  server: {
    // Para testar via Live Reload local ou túnel (ex: http://192.168.x.x:5173 ou ngrok)
    // Descomente ou ajuste a url abaixo para apontar para a sua máquina de desenvolvimento
    // url: 'http://10.0.2.2:5173', // Para emulador Android padrão
    // url: 'http://192.168.1.100:5173', // Para aparelho físico na mesma rede Wi-Fi
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
