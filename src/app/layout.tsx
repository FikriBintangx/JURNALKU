import { Geist, Plus_Jakarta_Sans } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import CompareBar from "@/components/CompareBar";
import { FloatingActionButtons } from "@/components/FloatingActionButtons";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ['400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
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
    <html lang="id" suppressHydrationWarning className={`${jakarta.variable} ${geistSans.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
        <NextThemesProvider
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
        </NextThemesProvider>
      </body>
    </html>
  );
}

