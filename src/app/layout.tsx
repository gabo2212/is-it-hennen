import type { Metadata } from "next";
import { Figtree, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
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
      className={`${instrument.variable} ${figtree.variable} ${geistMono.variable} h-full dark`}
    >
      <body className="min-h-full bg-[#070708] font-sans antialiased">{children}</body>
    </html>
  );
}
