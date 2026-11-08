'use client';

import type { Config } from '@/lib/config';
import { Invitacion } from './Invitacion';
import { InvitacionBoda, InvitacionQuince } from './InvitacionElegante';
import type { InvitadoVista } from './useInvitacionBase';

export interface PropsInvitacion {
  config: Config;
  invitado: InvitadoVista;
  vistaPrevia?: boolean;
  volver?: boolean;
  soloLectura?: boolean;
}

// Cada plantilla de evento tiene su composición; todas comparten el mismo motor.
export function InvitacionPorPlantilla({ plantilla, ...p }: PropsInvitacion & { plantilla: string }) {
  if (plantilla === 'boda') return <InvitacionBoda {...p} />;
  if (plantilla === 'quince') return <InvitacionQuince {...p} />;
  return <Invitacion {...p} />;
}
