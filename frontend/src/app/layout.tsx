import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrowEasy CSV Importer — AI-Powered CRM Lead Import",
  description:
    "Upload any CSV file and let AI intelligently extract and map lead data into GrowEasy CRM format. Supports Facebook Ads, Google Ads, Excel exports, and more.",
  keywords: [
    "CSV importer",
    "CRM",
    "lead import",
    "AI data extraction",
    "GrowEasy",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
