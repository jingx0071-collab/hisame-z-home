import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./_styles/tokens.css";
import RealtimeProvider from "./RealtimeProvider";
import { ThemeProvider } from "./_components/ThemeProvider";
import ViewportFix from "./_components/ViewportFix";
import AppHeader from "./_components/AppHeader";
import EdgeSwipeBack from "./_components/EdgeSwipeBack";
import StatusBarTint from "./_components/StatusBarTint";
import AppLifecycle from "./_components/AppLifecycle";
import NotificationInit from "./_components/NotificationInit";
import ApnsRegistrar from "./_components/ApnsRegistrar";
import GlobalTapHaptics from "./_components/GlobalTapHaptics";
import PullToRefresh from "./_components/PullToRefresh";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Z",
  description: "for Hisame",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Z",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1620",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider><RealtimeProvider><div className="app-shell"><AppHeader /><div className="app-body">{children}</div></div></RealtimeProvider></ThemeProvider>
        <ViewportFix />
        <EdgeSwipeBack />
        <StatusBarTint />
        <AppLifecycle />
        <NotificationInit />
        <ApnsRegistrar />
        <GlobalTapHaptics />
        <PullToRefresh />
      </body>
    </html>
  );
}
