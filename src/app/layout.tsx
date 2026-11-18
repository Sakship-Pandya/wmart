import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Root layout: shared by the store (shop) and the admin panel (admin).
// Store header/footer live in app/(shop)/layout.tsx, admin sidebar in app/(admin)/admin/layout.tsx.

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "WMart – Laptop Batteries, Adapters & Chargers Online India",
    template: "%s | WMart",
  },
  description:
    "Genuine laptop batteries, chargers and power cables for HP, Dell, Lenovo, Asus, Apple and more. GST invoice, Cash on Delivery and free shipping across India.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
