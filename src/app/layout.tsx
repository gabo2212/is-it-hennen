import type { Metadata } from "next";
import { Figtree, Geist_Mono, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Is it hennen? · CNN Presentation",
  description:
    "Short CNN presentation: train on Hennen pics, then answer — is it hennen or not?",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${figtree.variable} ${geistMono.variable} h-full dark`}
    >
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
