import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'HostelSync | Policy-Driven Hostel Allocation & Roommate Matching',
  description:
    'Deterministic hostel room allocation engine with encrypted lifestyle compatibility matching, warden bed-map review, and auditable publication.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
        <Providers>
          <Navbar />
          <div className="min-h-[calc(100vh-4rem)]">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
