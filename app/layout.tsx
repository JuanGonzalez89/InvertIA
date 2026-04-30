import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AppHeader } from "@/components/dashboard/app-header"
import "./globals.css"
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "InvertIA — AI Portfolio Manager",
  description:
    "Plataforma fintech con inteligencia artificial: gestioná tu cartera, analizá CEDEARs y bonos, y tomá decisiones con IA.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport = {
  themeColor: "#070809",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="es" className={`dark ${geistSans.variable} ${geistMono.variable} bg-background`}>
        <body className="font-sans antialiased">
          <div className="relative min-h-screen bg-background text-foreground">
            {/* Subtle terminal grid background */}
            <div
              aria-hidden
              className="pointer-events-none fixed inset-0 terminal-grid opacity-[0.25]"
            />
            <div
              aria-hidden
              className="pointer-events-none fixed inset-0 bg-gradient-to-b from-background/0 via-background/0 to-background"
            />

            <AppHeader />

            <main className="relative mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
              {children}

              <footer className="pt-4 pb-2 text-center font-mono text-[11px] text-muted-foreground">
                InvertIA · v1.0 · Datos de mercado simulados con fines de demostración
              </footer>
            </main>
          </div>
          {process.env.NODE_ENV === "production" && <Analytics />}
        </body>
      </html>
    </ClerkProvider>
  )
}
