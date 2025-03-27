'use client'; // This component needs to be a Client Component

import Navbar from '@/components/Navbar';
import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create a client
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false, // Disable refetch on window focus
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  });

  return (
    <html lang='en'>
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <Toaster
            position="top-right"
            containerStyle={{
              position: 'fixed',
              top: '20px',
              left: '0',
              right: '0',
              margin: '0 auto',
              zIndex: '9999',
            }}
            toastOptions={{
              style: {
                background: '#363636',
                color: '#fff',
                padding: '16px 24px',
                borderRadius: '8px',
              },
            }}
          />

          <main className='h-screen flex flex-col justify-center items-center relative'>
            <Navbar />
            {children}
          </main>

          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}