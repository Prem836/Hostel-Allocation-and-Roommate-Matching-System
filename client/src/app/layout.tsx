import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Campus Residence Portal | Hostel Allotment & Roommate Matching',
  description:
    'Official university hostel allotment portal. Apply for room allocations, rank hostel preferences, find compatible roommates, and download verified allotment confirmation slips.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f7faf5] text-[#1e3831] antialiased selection:bg-[#B1D3B9] selection:text-[#1e3831]">
        <Providers>
          <Navbar />
          <div className="min-h-[calc(100vh-4rem)]">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
