import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'GOLD Admin',
  // This, not robots.txt, is what keeps admin pages out of search results. A
  // Disallow line would publish the path to anyone reading robots.txt, and would
  // also stop crawlers from ever seeing this tag.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false }
  }
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#171314] text-white">{children}</div>;
}
