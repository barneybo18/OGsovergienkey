import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
