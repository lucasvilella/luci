import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/hooks/use-auth'
import { ConversationProvider } from '@/hooks/use-conversation'
import './globals.css'

export const metadata: Metadata = {
  title: 'LUCI',
  description: 'Painel mobile com assistente de voz, chat, player de música e casa inteligente.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LUCI',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#023D8A' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1A2E' },
  ],
  userScalable: false,
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('nova-theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.add(theme);
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className="bg-background"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
        <AuthProvider>
          <ConversationProvider>
            {children}
          </ConversationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
