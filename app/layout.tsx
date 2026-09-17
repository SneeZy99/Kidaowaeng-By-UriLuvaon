import type { Metadata } from "next";
import { Oswald, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { AuroraBackground } from "@/components/ReactBitsEffects";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-oswald",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

const jbmono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jbmono",
});

export const metadata: Metadata = {
  title: "The Vault — ระบบคลังแก๊ง",
  description: "ระบบจัดการคลังเงินและไอเทมของแก๊ง",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body
        className={`${oswald.variable} ${inter.variable} ${jbmono.variable} font-body antialiased`}
      >
        <AuroraBackground />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
