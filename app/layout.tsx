import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EstateFlow AI — Dubai Real Estate Sales CRM",
  description:
    "AI-powered lead qualification, follow-up approvals and sales automation for high-performing real estate teams.",
  openGraph: {
    title: "EstateFlow AI",
    description: "Real estate leads. Qualified, routed, converted.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "EstateFlow AI sales CRM" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EstateFlow AI",
    description: "Real estate leads. Qualified, routed, converted.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
