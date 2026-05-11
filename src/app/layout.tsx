import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import CompareBar from "@/components/CompareBar";
import { FloatingActionButtons } from "@/components/FloatingActionButtons";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "JurnalStar - AI Academic Research Engine",
  description: "Meta Search Engine Jurnal Akademik dengan dukungan AI Gemini. Anti Rate Limit, Multi-Source, dan Zero Crash Experience.",
  keywords: ["jurnal", "riset", "akademik", "AI", "Gemini", "OpenAlex", "Semantic Scholar"],
  authors: [{ name: "JurnalStar Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            {children}
            <CompareBar />
            <FloatingActionButtons />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

