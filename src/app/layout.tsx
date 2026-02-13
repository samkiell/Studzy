import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AIProvider } from "@/components/providers/AIProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Studzy AI – AI Study Assistant for University Exam Success",
    template: "%s | Studzy AI",
  },
  description:
    "Studzy AI is an intelligent academic assistant that helps university students generate quizzes, flashcards, summaries, and exam predictions instantly. Study smarter with AI-powered learning tools.",
  keywords: [
    "AI study assistant",
    "university exam preparation",
    "AI quiz generator",
    "AI flashcards",
    "AI learning platform",
    "student revision tool",
    "campus study platform",
    "AI exam predictor",
    "study smarter with AI",
    "university study tools",
  ],
  authors: [{ name: "Samkiel", url: "https://samkiel.dev" }],
  creator: "Samkiel",
  publisher: "Studzy",
  robots: { index: true, follow: true },
  metadataBase: new URL("https://studzy.me"),
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://studzy.me",
    siteName: "Studzy AI",
    title: "Studzy AI – Study Smarter with AI",
    description:
      "Generate quizzes, flashcards, summaries, and exam predictions with AI. Built for university students.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Studzy AI – AI Study Assistant for University Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Studzy AI – AI Study Assistant",
    description: "Smarter revision. Better results. Powered by AI.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
                priceCurrency: "USD",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <AIProvider>{children}</AIProvider>
      </body>
    </html>
  );
}
