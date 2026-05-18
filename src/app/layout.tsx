import "./globals.css";
import { Toaster } from "sonner";
import { Footer } from "@/components/layout/footer";
import { AppHeader } from "@/components/layout/app-header";
import { getAuthenticatedUser } from "@/utils/auth";
import { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { PostHogProvider } from "@/components/analytics/posthog-provider";
import { PostHogPageView } from "@/components/analytics/posthog-pageview";
import { Suspense } from "react";


// Only enable Vercel Analytics when running on Vercel platform
const isVercel = process.env.VERCEL === '1';

export const metadata: Metadata = {
  metadataBase: new URL("https://resumelm.com"),
  title: {
    default: "ResumeLM - AI-Powered Resume Builder",
    template: "%s | ResumeLM"
  },
  description: "Create tailored, ATS-optimized resumes powered by AI. Land your dream tech job with personalized resume optimization.",
  applicationName: "ResumeLM",
  keywords: ["resume builder", "AI resume", "ATS optimization", "tech jobs", "career tools", "job application"],
  authors: [{ name: "ResumeLM" }],
  creator: "ResumeLM",
  publisher: "ResumeLM",
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
    siteName: "ResumeLM",
    title: "ResumeLM - AI-Powered Resume Builder",
    description: "Create tailored, ATS-optimized resumes powered by AI. Land your dream tech job with personalized resume optimization.",
    images: [
      {
        url: "/og.webp",
        width: 1200,
        height: 630,
        alt: "ResumeLM - AI Resume Builder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeLM - AI-Powered Resume Builder",
    description: "Create tailored, ATS-optimized resumes powered by AI. Land your dream tech job with personalized resume optimization.",
    images: ["/og.webp"],
    creator: "@resumelm",
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
  // verification: {
  //   google: "google-site-verification-code", // Replace with actual verification code
  // },
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
    // Not authenticated — user stays null
  }

  return (
    <html lang="en">
      <body className="font-sans">
        <PostHogProvider
          user={user ? {
            id: user.id,
          } : null}
        >
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <div className="relative min-h-screen h-screen flex flex-col">
            {user && (
              <AppHeader />
            )}
            {/* Padding for header and footer */}
            <main className="py-14 h-full">
              {children}
              {isVercel && <Analytics />}
            </main>
            {user && <Footer /> }
          </div>
          <Toaster
            richColors
            position="top-right"
            closeButton
            toastOptions={{
              style: {
                fontSize: '1rem',
                padding: '16px',
                minWidth: '400px',
                maxWidth: '500px'
              }
            }}
          />
        </PostHogProvider>
      </body>
    </html>
  );
}
