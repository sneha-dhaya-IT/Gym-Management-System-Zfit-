import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import ErrorSuppressor from "@/components/ErrorSuppressor";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZFit",
  description: "ZFit Gym Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress third-party script errors
              window.addEventListener('error', function(e) {
                if (e.filename && e.filename.includes('ma_payload.js')) {
                  e.preventDefault();
                  return false;
                }
              });
              
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.stack && e.reason.stack.includes('ma_payload.js')) {
                  e.preventDefault();
                  return false;
                }
              });
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

            <AuthProvider>
              {children}
              <Toaster 
                theme="dark" 
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#202022',
                    border: '1px solid #404040',
                    color: '#ffffff',
                  },
                }}
              />
            </AuthProvider>

      </body>
    </html>
  );
}
