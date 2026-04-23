import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ConnectWallet } from "@/components/ConnectWallet";

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
      <body className="antialiased selection:bg-brand-purple/30">
        <Providers>
          <div className="absolute top-6 right-8 z-50">
            <ConnectWallet />
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
