import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AIProvider } from "@/components/providers/AIProvider";
import { UserPresence } from "@/components/auth/UserPresence";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "react-hot-toast";
import { InstallPWA } from "@/components/pwa/InstallPWA";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Studzy – Software Engineering Learning Platform | OAU",
    template: "%s | Studzy",
  },
  description:
    "Studzy is a dedicated learning and revision platform for Software Engineering students at Obafemi Awolowo University (OAU). Access course materials, structured resources, and exam-focused content in one organized workspace.",
  keywords: [
    "OAU software engineering",
    "Obafemi Awolowo University resources",
    "OAU department of computer science",
    "software engineering study platform",
    "programming course materials OAU",
    "CSC 201 OAU",
    "OAU lecture notes",
    "university exam preparation",
  ],
  authors: [{ name: "Samkiel", url: "https://samkiel.dev" }],
  creator: "Samkiel",
  publisher: "Studzy",
  robots: { index: true, follow: true },
  metadataBase: new URL("https://studzy.me"),
  alternates: { canonical: "https://studzy.me" },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Studzy",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://studzy.me",
    siteName: "Studzy",
    title: "Studzy – Software Engineering Learning Platform | OAU",
    description:
      "Studzy is a dedicated learning and revision platform for Software Engineering students at Obafemi Awolowo University (OAU). Access course materials, structured resources, and exam-focused content in one organized workspace.",
    images: [
      {
        url: "/favicon.png", // Ensure this exists or fallback to a default
        width: 1200,
        height: 630,
        alt: "Studzy - Software Engineering Learning Platform OAU",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Studzy – Software Engineering Learning Platform",
    description: "Dedicated learning platform for Software Engineering university students.",
    images: ["/favicon.png"],
  },
};

import { Footer } from "@/components/ui/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#4f46e5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Studzy" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Studzy AI",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              url: "https://studzy.me",
              description:
                "AI-powered academic assistant for university students. Generate quizzes, flashcards, summaries, and exam predictions instantly.",
              creator: {
                "@type": "Person",
                name: "Samkiel",
                url: "https://samkiel.dev",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "NGN",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased flex flex-col min-h-screen`} suppressHydrationWarning>
        <UserPresence />
        <LoadingProvider>
          <AIProvider>
            <div className="flex-1 flex flex-col">
              {children}
            </div>
          </AIProvider>
        </LoadingProvider>
        <InstallPWA />
        <Analytics />
        <SpeedInsights />
        <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  );
}
