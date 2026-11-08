import { FormAuth } from '@/components/FormAuth';

export const metadata = { title: 'Entrar', robots: { index: false, follow: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  const { siguiente } = await searchParams;
  return <FormAuth modo="login" siguiente={siguiente?.startsWith('/') ? siguiente : '/app'} />;
}
