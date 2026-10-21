import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { PaperGrain } from "@/components/watercolour/Watercolour";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cascade",
  description: "Tell us what you sell. Get the people who will buy it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>
        {children}
        <PaperGrain />
      </body>
    </html>
  );
}
