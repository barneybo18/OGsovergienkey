import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ConnectWallet } from "@/components/ConnectWallet";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Sovereign Agent Keys | Mission Control",
  description: "0G Labs Hackathon Mission Control",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased selection:bg-brand-purple/30">
        <Providers>
          <div className="absolute top-6 right-8 z-50">
            <ConnectWallet />
          </div>
          {children}
          <Toaster theme="dark" position="bottom-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
