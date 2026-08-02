import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Consumer Attention Mapping System",
  description: "Retail intelligence dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
