import Navbar from "@/components/app-navbar/navbar";
import { AutoConnect } from "@/components/auto-connect";
import { GlobalProvider } from "@/components/providers";
import { getAccountCookie } from "@/lib/cookies/account.server";
import { fontVariables } from "@/styles/fonts";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@workspace/ui/components/sonner";
import "@workspace/ui/styles/aggregated.css";
import { cn } from "@workspace/ui/lib/utils";
import type { Metadata, Viewport } from "next";
import { PropsWithChildren } from "react";

const AppName = "EvoVerses";
const AppDescription = "A 3D monster battling game bringing Web2 and Web3 together in one platform.";
const BaseURL = "https://evoverses.com";

export const viewport: Viewport = {
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(BaseURL),
  title: {
    default: AppName,
    template: "%s | EvoVerses",
  },
  description: AppDescription,
  generator: "Next.js",
  applicationName: AppName,
  referrer: "origin-when-cross-origin",
  keywords: [ "EvoVerses", "Unreal Engine", "Crypto", "Monster", "NFT", "Video Game" ],
  authors: [
    { name: "Nicholas St. Germain", url: "https://cajun.pro" },
  ],

  creator: "Nicholas St. Germain",
  publisher: "Vercel",
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: AppName,
    description: AppDescription,
    url: BaseURL,
    siteName: AppName,
    images: { url: "/icon.png", width: 512, height: 512, alt: "EvoVerses Logo" },
    locale: "en_US",
    type: "website",
  },
  twitter: {
    title: AppName,
    description: AppDescription,
    images: { url: "/icon.png", alt: "EvoVerses Logo", width: 512, height: 512 },
    card: "summary",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/icon.png",
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
      nocache: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const RootLayout = async ({ children }: PropsWithChildren) => {
  const accountCookie = await getAccountCookie();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("overscroll-none font-sans antialiased overflow-x-hidden text-foreground", fontVariables)}>
        <GlobalProvider>
          {accountCookie.loggedIn && <AutoConnect account={accountCookie.address} />}
          <main className="relative flex min-h-svh flex-1 flex-col bg-background bg-contain bg-top bg-no-repeat bg-fixed">
            <Navbar accountCookie={accountCookie} />
            <div className="@container flex-1 group/global select-none">
              {children}
            </div>
          </main>
        </GlobalProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
