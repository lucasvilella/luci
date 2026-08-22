import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/hooks/use-auth'
import { ConversationProvider } from '@/hooks/use-conversation'
import './globals.css'

export const metadata: Metadata = {
  title: 'Luci — Central Inteligente',
  description: 'Painel mobile com assistente de voz, chat, player de música e casa inteligente.',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8fc' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0e1a' },
  ],
  userScalable: false,
  width: 'device-width',
  initialScale: 1,
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
