import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.luci.assistant',
  appName: 'Luci',
  webDir: 'out',
  server: {
    // O app carrega a UI diretamente do servidor FastAPI do Termux via Ngrok.
    // Isso garante que o WebView sempre receba o HTML/JS/CSS mais recente
    // sem precisar rebuildar o APK a cada mudança de frontend.
    url: 'https://subdivide-clip-easiest.ngrok-free.dev',
    cleartext: true,
    androidScheme: 'https',
    // Headers enviados automaticamente em cada request do WebView
    allowNavigation: ['*.ngrok-free.dev', '*.ngrok.io', 'fonts.googleapis.com', 'fonts.gstatic.com']
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {}
};

export default config;
