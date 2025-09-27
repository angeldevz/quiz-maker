import { Typography } from "@mui/material";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { AppProvider } from "../providers/AppProvider";
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
  title: "Quiz Maker",
  description: "for Bookipi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AppProvider>
          <header className="p-4 flex flex-col gap-2 items-center my-8">
            <Link href="/">
              <Typography variant="h1">Quiz Maker</Typography>
            </Link>
            <Typography variant="subtitle1">by: Rustan</Typography>
          </header>
          <main className="mb-10">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
