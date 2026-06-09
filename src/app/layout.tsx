import type { Metadata } from "next";
import { Lexend, Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Lexend — the dyslexia-friendly default per the spec.
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

// Atkinson Hyperlegible — an alternative legibility font students can pick from
// the reading settings bar (exposed via the --font-atkinson variable).
const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
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
    <html
      lang="en"
      className={`${lexend.variable} ${atkinson.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
