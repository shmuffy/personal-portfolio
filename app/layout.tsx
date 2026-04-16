import type { Metadata } from "next";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { NoiseOverlay } from "@/components/ui/NoiseOverlay";
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { MascotRobot } from "@/components/ui/MascotRobot";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Christian Kim",
    default: "Christian Kim — Electrical Design Engineer",
  },
  description:
    "Christian Kim — EE student at UC Riverside building high-voltage power electronics, embedded systems, and RF hardware.",
  openGraph: {
    type: "website",
    siteName: "Christian Kim",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-void text-signal font-body min-h-full flex flex-col">
        <LoadingAnimation />
        <MascotRobot />
        <ScanlineOverlay />
        <NoiseOverlay />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
