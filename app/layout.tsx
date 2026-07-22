import type { Metadata, Viewport } from "next"
import { ErrorBoundary } from "@/components/error-boundary"
import { ErrorReporterInit } from "@/components/error-boundary/error-reporter-init"
import "./globals.css"
import Script from "next/script"
import { SpeedInsights } from "@vercel/speed-insights/next"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "ip.world",
  description: "trade and own internet culture",
  icons: {
    icon: "/logo.svg",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical images */}
        <link rel="preload" href="/svg/active.svg" as="image" />
        <link rel="preload" href="/svg/add-1.svg" as="image" />
        {/* Performance optimization */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <Script src="https://app.debridge.finance/assets/scripts/widget.js" async defer strategy="lazyOnload" />
      </head>
      <body className="dark min-h-screen antialiased">
        <ErrorBoundary>
          <ErrorReporterInit />
          {children}
        </ErrorBoundary>
        <SpeedInsights />
      </body>
    </html>
  )
}
