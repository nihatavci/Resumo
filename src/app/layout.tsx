import "./globals.css";
import { DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { getAuthenticatedUser } from "@/utils/auth";
import { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { PostHogProvider } from "@/components/analytics/posthog-provider";
import { PostHogPageView } from "@/components/analytics/posthog-pageview";
import { Suspense } from "react";
import { MotionProvider } from "@/components/motion/motion-config";
import { PageTransition } from "@/components/motion/page-transition";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});


const isVercel = process.env.VERCEL === '1';

export const metadata: Metadata = {
  metadataBase: new URL("https://resumelm.com"),
  title: {
    default: "Resumo — AI Resume Builder",
    template: "%s | Resumo"
  },
  description: "Create tailored, ATS-optimized resumes powered by AI.",
  applicationName: "Resumo",
  keywords: ["resume builder", "AI resume", "ATS optimization", "career tools"],
  authors: [{ name: "Resumo" }],
  creator: "Resumo",
  publisher: "Resumo",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Resumo",
    title: "Resumo — AI Resume Builder",
    description: "Create tailored, ATS-optimized resumes powered by AI.",
    images: [
      {
        url: "/og.webp",
        width: 1200,
        height: 630,
        alt: "Resumo — AI Resume Builder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resumo — AI Resume Builder",
    description: "Create tailored, ATS-optimized resumes powered by AI.",
    images: ["/og.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: { id: string; email: string | null } | null = null;
  try {
    user = await getAuthenticatedUser();
  } catch {
    // Not authenticated
  }

  return (
    <html lang="en" className={dmSans.variable}>
      <body className="font-sans bg-dia-canvas">
        <PostHogProvider
          user={user ? { id: user.id } : null}
        >
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <div className="relative min-h-screen h-screen flex flex-col">
            <MotionProvider>
              <main className="h-full">
                <PageTransition>
                  {children}
                </PageTransition>
                {isVercel && <Analytics />}
              </main>
            </MotionProvider>
          </div>
          <Toaster
            position="top-right"
            closeButton
            toastOptions={{
              style: {
                fontSize: '0.875rem',
                padding: '16px',
                borderRadius: '16px',
                boxShadow: '0px 0px 8px 0px rgba(0,0,0,0.08)',
              }
            }}
          />
        </PostHogProvider>
      </body>
    </html>
  );
}
