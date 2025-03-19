import type { ReactNode } from "react";
import { Inter, Fira_Code } from "next/font/google";
import localFont from "next/font/local";
import { DeepgramContextProvider } from "./context/DeepgramContextProvider";
import { MicrophoneContextProvider } from "./context/MicrophoneContextProvider";
import { VoiceBotProvider } from "./context/VoiceBotContextProvider";
import AnimatedBackground from "./components/AnimatedBackground";
import VendorScripts from "./components/VendorScripts";

import "./globals.css";
import { sharedOpenGraphMetadata } from "./lib/constants";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "fallback",
});
const fira = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira",
  display: "fallback",
});
const favorit = localFont({
  src: "./fonts/ABCFavorit-Bold.woff2",
  weight: "700",
  variable: "--font-favorit",
  display: "fallback",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_PATH || ""),
  title: "Voice Agent | Deepgram",
  description: "Meet Deepgram's Voice Agent API",
  openGraph: sharedOpenGraphMetadata,
  twitter: {
    card: "summary_large_image",
    site: "@DeepgramAI",
    creator: "@DeepgramAI",
  },
};

const fonts = [inter, fira, favorit].map((font) => font.variable).join(" ");

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fonts} font-inter`}>
      <body>
        <AnimatedBackground>
          <VoiceBotProvider>
            <MicrophoneContextProvider>
              <DeepgramContextProvider>{children}</DeepgramContextProvider>
            </MicrophoneContextProvider>
          </VoiceBotProvider>
        </AnimatedBackground>
        <VendorScripts />
      </body>
    </html>
  );
}
