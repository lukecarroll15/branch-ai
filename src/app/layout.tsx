import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Lexend — the dyslexia-friendly default per the spec. To swap fonts later,
// change this import and the --font-lexend variable reference in globals.css.
// (A per-student font switcher comes in a later phase.)
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Branch · Study notes that make sense",
    template: "%s · Branch",
  },
  description:
    "Branch turns dense documents into clean, colour-coded study notes designed for dyslexic students. Calmer reading, clearer understanding.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lexend.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
