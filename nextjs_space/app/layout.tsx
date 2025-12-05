
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OrganiZen - Sistema de Gestão Hierárquica',
  description: 'Sistema de gestão hierárquica multi-tenant para empresas',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/icon-192x192.png.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'OrganiZen',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#1e40af',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OrganiZen" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        
        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('ServiceWorker registration successful:', registration.scope);
                    
                    // Check for updates every hour
                    setInterval(function() {
                      registration.update();
                    }, 3600000);
                    
                    // Listen for updates
                    registration.addEventListener('updatefound', function() {
                      const newWorker = registration.installing;
                      newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          console.log('Nova versão disponível! Atualizando...');
                          // Skip waiting and reload
                          newWorker.postMessage({ type: 'SKIP_WAITING' });
                          window.location.reload();
                        }
                      });
                    });
                  },
                  function(err) {
                    console.log('ServiceWorker registration failed:', err);
                  }
                );
              });
              
              // Listen for controller change and reload
              navigator.serviceWorker.addEventListener('controllerchange', function() {
                console.log('Service Worker atualizado!');
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
