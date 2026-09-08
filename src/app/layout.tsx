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
import NotificationRouter from "./_components/NotificationRouter";
import GlobalTapHaptics from "./_components/GlobalTapHaptics";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Cormorant+Infant:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Fraunces:ital,wght,opsz@0,300..700,9..144;1,300..700,9..144&family=Petit+Formal+Script&family=Noto+Serif+SC:wght@200;300;400;500;600;700&family=ZCOOL+XiaoWei&family=EB+Garamond:ital@0;1&family=JetBrains+Mono:wght@300;400;500;600&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=DotGothic16&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider><RealtimeProvider><div className="app-shell"><AppHeader /><div className="app-body">{children}</div></div></RealtimeProvider></ThemeProvider>
        <ViewportFix />
        <EdgeSwipeBack />
        <StatusBarTint />
        <AppLifecycle />
        <NotificationInit />
        <ApnsRegistrar />
        <NotificationRouter />
        <GlobalTapHaptics />
      </body>
    </html>
  );
}
