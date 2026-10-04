'use client';

import { useState } from 'react';
import { crearProyecto } from '@/app/acciones';
import { useAccion } from '@/hooks/useAccion';
import { NEGOCIOS, type ClaseProyecto } from '@/lib/tipos';

const ETAPAS_PRODUCTO =
  'Idea, Investigación, Mecánica, Contenido, Diseño, Costos, Proveedor, Prototipo, Pruebas, Packaging, Producción, Oferta, Landing, Ads, Lanzamiento';

export default function NuevoProyecto({ activos }: { activos: number }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [negocio, setNegocio] = useState('SHOTYGAMES');
  const [clase, setClase] = useState<ClaseProyecto>('PRODUCTO');
  const [objetivo, setObjetivo] = useState('');
  const [etapas, setEtapas] = useState(ETAPAS_PRODUCTO);
  const { pendiente, error, correr } = useAccion();

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="pulsable w-full rounded-[var(--radius-tarjeta)] border border-dashed border-[var(--color-borde-fuerte)] px-4 py-3 text-sm font-medium text-[var(--color-texto-suave)]"
      >
        + Nuevo proyecto (entra a la cola)
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        correr(
          () => crearProyecto({ nombre, negocio, clase, objetivo, etapas: etapas.split(',').map((s) => s.trim()) }),
          () => {
            setAbierto(false);
            setNombre('');
            setObjetivo('');
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
      <div className="flex gap-2">
        <button type="button" onClick={() => setAbierto(false)} className="pulsable boton flex-1">
          Cancelar
        </button>
        <button type="submit" disabled={pendiente || !nombre.trim()} className="pulsable boton-primario flex-1">
          Crear
        </button>
      </div>
      {error && <p className="text-sm text-[var(--color-rojo)]">{error}</p>}
    </form>
  );
}
