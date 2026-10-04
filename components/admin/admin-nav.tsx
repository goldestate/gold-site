import Link from 'next/link';

const SECTIONS = [
  { key: 'properties', label: 'Properties', href: '/goldenadmin2026/properties' },
  { key: 'rental-desk', label: 'Rental Desk', href: '/goldenadmin2026/rental-desk' },
  { key: 'directory', label: 'Directory', href: '/goldenadmin2026/directory' }
] as const;

export type AdminSection = (typeof SECTIONS)[number]['key'];

/**
 * The admin's sections, in one place. Each page used to write its own links, and
 * the Rental Desk page never got the Directory one -- staff had to go back through
 * Properties to reach it.
 */
export function AdminNav({ current }: { current: AdminSection }) {
  return (
    <nav
      aria-label="Admin sections"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]"
    >
      {SECTIONS.map((section) =>
        section.key === current ? (
          <span key={section.key} aria-current="page">
            {section.label}
          </span>
        ) : (
          <Link key={section.key} href={section.href} className="text-white/40 transition hover:text-[#D9B355]">
            {section.label}
          </Link>
        )
      )}
    </nav>
  );
}
