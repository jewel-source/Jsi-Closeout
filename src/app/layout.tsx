import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QuoteCartProvider } from "@/context/QuoteCartContext";
import Header from "@/components/Header";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "Jewel Source — Closeout Jewelry Catalog",
  description: "Browse our closeout jewelry catalog and request a quote.",
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QuoteCartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-black/10 mt-16">
            <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-black/60">
              Jewel Source Inc. &middot; Questions? info@jewelsource.inc
            </div>
          </footer>
        </QuoteCartProvider>
      </body>
    </html>
  );
}
