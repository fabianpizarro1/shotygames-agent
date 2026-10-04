import { cargarTodo } from '@/lib/datos';
import { calcularNivel, calcularXP, cumplimientoSemana } from '@/lib/calculos';
import CabeceraProgreso from '@/components/CabeceraProgreso';
import NavTabs from '@/components/NavTabs';
import BotonCaptura from '@/components/BotonCaptura';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const datos = await cargarTodo();
  const xp = calcularXP(datos);
  const { nivel, progresoPct } = calcularNivel(xp);
  const { pct } = cumplimientoSemana(datos);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col pad-lados">
      <header className="pad-arriba sticky top-0 z-10 border-b border-[var(--color-borde)] bg-[var(--color-fondo)]/90 backdrop-blur">
        <CabeceraProgreso nivel={nivel} xpTotal={xp} progresoPct={progresoPct} semanaPct={pct} />
        <NavTabs />
      </header>
      <main className="flex-1 px-4 py-5 pb-28 pad-abajo">{children}</main>
      <BotonCaptura />
    </div>
  );
}
