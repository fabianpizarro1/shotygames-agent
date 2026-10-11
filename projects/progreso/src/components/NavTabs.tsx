'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IA_ACTIVA } from '@/lib/ia-activa';

const TABS = [
  { href: '/', label: 'Hoy' },
  { href: '/tareas', label: 'Tareas' },
  { href: '/proyectos', label: 'Proyectos' },
  ...(IA_ACTIVA ? [{ href: '/ia', label: 'IA' }] : []),
  { href: '/ceo', label: 'CEO' },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 px-2 pb-2">
      {TABS.map((tab) => {
        const activo = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`pulsable flex-1 rounded-lg px-1 py-2 text-center text-sm font-medium transition-colors ${
              activo ? 'bg-[var(--color-acento-tenue)] text-[var(--color-acento)]' : 'text-[var(--color-texto-suave)]'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
