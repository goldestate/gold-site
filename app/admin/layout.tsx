import type { ReactNode } from 'react';

export const metadata = {
  title: 'GOLD Admin',
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#171314] text-white">{children}</div>;
}
