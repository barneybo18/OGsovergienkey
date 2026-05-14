import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { Web3Provider, wagmiConfig } from "@/components/Web3Provider";

export const metadata: Metadata = {
  title: "Sovereign Agent Keys | Mission Control",
  description: "0G Labs Hackathon Mission Control",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the wallet connection cookie on the server so the client can hydrate
  // with the correct connected state immediately — no flash of "disconnected" on refresh.
  const cookie = (await headers()).get("cookie");
  const initialState = cookieToInitialState(wagmiConfig, cookie);

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased selection:bg-brand-purple/30">
        <Web3Provider initialState={initialState}>
          {children}
          <Toaster theme="dark" position="bottom-right" richColors />
        </Web3Provider>
      </body>
    </html>
  );
}
