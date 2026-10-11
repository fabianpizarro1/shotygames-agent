'use client';

import { useState } from 'react';
import { crearProyecto } from '@/app/acciones';
import { useAccion } from '@/hooks/useAccion';
import { IA_ACTIVA } from '@/lib/ia-activa';
import { NEGOCIOS, type ClaseProyecto } from '@/lib/tipos';
import type { ResultadoOrganizar } from '@/lib/organizador';
import ResultadoPlan from './ResultadoPlan';

const ETAPAS_PRODUCTO =
  'Idea, Investigación, Mecánica, Contenido, Diseño, Costos, Proveedor, Prototipo, Pruebas, Packaging, Producción, Oferta, Landing, Ads, Lanzamiento';

export default function NuevoProyecto({ activos }: { activos: number }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [negocio, setNegocio] = useState('SHOTYGAMES');
  const [clase, setClase] = useState<ClaseProyecto>('PRODUCTO');
  const [objetivo, setObjetivo] = useState('');
  const [etapas, setEtapas] = useState(ETAPAS_PRODUCTO);
  const [fecha, setFecha] = useState('');
  const [empezar, setEmpezar] = useState(true);
  const [plan, setPlan] = useState<ResultadoOrganizar | null>(null);
  const { pendiente, error, correr } = useAccion();

  if (!abierto) {
    return (
      <div className="flex flex-col gap-2">
        {plan && <ResultadoPlan r={plan} />}
      <button
        onClick={() => setAbierto(true)}
        className="pulsable w-full rounded-[var(--radius-tarjeta)] border border-dashed border-[var(--color-borde-fuerte)] px-4 py-3 text-sm font-medium text-[var(--color-texto-suave)]"
      >
        + Nuevo proyecto
      </button>
      </div>
    );
  }
  const organizar = IA_ACTIVA && !!fecha && empezar;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        correr(
          () =>
            crearProyecto({
              nombre,
              negocio,
              clase,
              objetivo,
              etapas: etapas.split(',').map((s) => s.trim()),
              fechaObjetivo: fecha,
              empezar: !!fecha && empezar,
            }),
          (r) => {
            setPlan(r.plan);
            setAbierto(false);
            setNombre('');
            setObjetivo('');
            setFecha('');
          }
        );
      }}
      className="tarjeta animar-aparecer flex flex-col gap-2 p-4"
    >
      {activos >= 4 && (
        <p className="rounded-lg bg-[var(--color-ambar-tenue)] px-3 py-2 text-xs text-[var(--color-ambar)]">
          Ya tienes {activos} proyectos activos. ¿Este es más importante que alguno de ellos, o es otra idea para la cola?
        </p>
      )}
      <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="campo" />
      <div className="flex gap-2">
        <select value={negocio} onChange={(e) => setNegocio(e.target.value)} className="campo">
          {NEGOCIOS.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
        </select>
        <select
          value={clase}
          onChange={(e) => {
            const c = e.target.value as ClaseProyecto;
            setClase(c);
            if (c === 'SISTEMA' && etapas === ETAPAS_PRODUCTO) setEtapas('Documentar, Probar, Delegar, Medir');
          }}
          className="campo"
        >
          <option value="PRODUCTO">Producto</option>
          <option value="SISTEMA">Sistema</option>
        </select>
      </div>
      <input value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="Objetivo (cómo se ve terminado)" className="campo" />
      <textarea value={etapas} onChange={(e) => setEtapas(e.target.value)} rows={3} className="campo text-sm" />
      <label className="flex items-center gap-2 text-sm">
        <span className="shrink-0 text-[var(--color-texto-suave)]">Fecha límite</span>
        <input type="date" value={fecha} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setFecha(e.target.value)} className="campo flex-1" />
      </label>
      {fecha && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={empezar} onChange={(e) => setEmpezar(e.target.checked)} className="mt-1" />
          <span>
            {IA_ACTIVA
              ? 'Empezar ya y que la IA lo organice: tareas hasta la fecha límite y las próximas 2 semanas en tu calendario.'
              : 'Empezar ya (activarlo). Las tareas las organizamos en tu sesión con Claude.'}
            <span className="block text-xs text-[var(--color-texto-tenue)]">Sin marcar, entra a la cola y lo organizas al activarlo.</span>
          </span>
        </label>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={() => setAbierto(false)} className="pulsable boton flex-1">
          Cancelar
        </button>
        <button type="submit" disabled={pendiente || !nombre.trim()} className="pulsable boton-primario flex-1">
          {pendiente ? (organizar ? 'Organizando… (≈2 min)' : 'Creando…') : organizar ? 'Crear y organizar' : 'Crear'}
        </button>
      </div>
      {error && <p className="text-sm text-[var(--color-rojo)]">{error}</p>}
    </form>
  );
}
