import type { Metadata } from 'next';
import { Dashboard } from '@/components/admin/Dashboard';

export const metadata: Metadata = { title: 'Panel · Invitación', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default function Admin() {
  return <Dashboard />;
}
