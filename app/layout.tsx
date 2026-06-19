import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Star Atlas Sourcer — AEP Aephia",
  description: "Community asset bounty & review pipeline for Star Atlas, by the AEP Aephia guild.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
          <footer className="border-t border-[#1f2c47] py-6 text-center text-xs text-[#5a6c8f]">
            Star Atlas Sourcer · AEP Aephia Guild · community-sourced assets
          </footer>
        </Providers>
      </body>
    </html>
  );
}
