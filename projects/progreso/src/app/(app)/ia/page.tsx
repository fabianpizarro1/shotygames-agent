import { hoyEC } from '@/lib/fecha';
import ChatIA from '@/components/ChatIA';
import { IA_ACTIVA, MENSAJE_IA_APAGADA } from '@/lib/ia-activa';

export default function IAPage() {
  if (!IA_ACTIVA) return <p className="tarjeta p-4 text-sm text-[var(--color-texto-suave)]">{MENSAJE_IA_APAGADA}</p>;
  return <ChatIA fecha={hoyEC()} />;
}
