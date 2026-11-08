import { FormAuth } from '@/components/FormAuth';

export const metadata = { title: 'Crear cuenta', robots: { index: false, follow: false } };

export default function Registro() {
  return <FormAuth modo="registro" siguiente="/app" />;
}
