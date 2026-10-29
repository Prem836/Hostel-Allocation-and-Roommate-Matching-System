import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hostel Allocation & Roommate Matching (P03)",
  description: "Policy-Driven Hostel Allocation Engine with Roommate Compatibility Matching",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}

