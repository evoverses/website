import "@/styles/aggregated.css";
import Navbar from "@/app/_navbar/navbar";
import Providers from "@/components/providers";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { PropsWithChildren } from "react";

const nunito = Nunito({ subsets: [ "latin" ], variable: "--font-nunito" });

const AppName = "EvoVerses";
const AppDescription = "A 3D monster battling game bringing Web2 and Web3 together in one platform.";
const BaseURL = "https://evoverses.com";

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
  colorScheme: "dark",
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
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  openGraph: {
    title: AppName,
    description: AppDescription,
    url: BaseURL,
    siteName: AppName,
    images: [
      { url: "/icon.png", width: 512, height: 512, alt: "EvoVerses Logo" },
    ],
    locale: "en_US",
    type: "website",
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

const RootLayout = ({ children }: PropsWithChildren) => {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="font-nunito">
        <Providers>
          <Navbar />
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
