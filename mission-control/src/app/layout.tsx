import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ConnectWallet } from "@/components/ConnectWallet";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Sovereign Agent Keys | Mission Control",
  description: "0G Labs Hackathon Mission Control",
};

import { Web3Provider } from "@/components/Web3Provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased selection:bg-brand-purple/30">
        <Web3Provider>
          <div className="absolute top-6 right-8 z-50">
            {/* Dave's ConnectWallet can go here if needed, but we have ConnectButtonCustom in page.tsx */}
          </div>
          {children}
          <Toaster theme="dark" position="bottom-right" richColors />
        </Web3Provider>
      </body>
    </html>
  );
}
