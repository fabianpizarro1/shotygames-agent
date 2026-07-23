/* CandyShots — Utils */
window.CS = window.CS || {};

(function () {
  'use strict';

  // ── Formato ───────────────────────────────────────────────────

  function fmt$(n, decimals = 2) {
    if (isNaN(n) || n === null) n = 0;
    return '$' + Number(n).toFixed(decimals);
  }

  function fmtPct(n) {
    if (isNaN(n) || n === null) return '—';
    return Number(n).toFixed(1) + '%';
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ── Costo por unidad mínima de un insumo ─────────────────────
  // Un insumo tiene: { unidad, cantidad_paquete, precio_paquete }
  // Devuelve: costo por 1g / 1ml / 1 unidad
  function costoPorUnidad(insumo) {
    const q = parseFloat(insumo.cantidad_paquete) || 1;
    const p = parseFloat(insumo.precio_paquete)   || 0;
    if (q === 0) return 0;
    return p / q;
  }

  // ── Costo de un ingrediente en la receta ─────────────────────
  // ingrediente: { insumo_id, cantidad } — cantidad en la misma unidad del insumo
  function costoIngrediente(ingrediente, insumos) {
    const insumo = insumos.find(i => i.id === ingrediente.insumo_id);
    if (!insumo) return 0;
    const cpu = costoPorUnidad(insumo);
    return cpu * (parseFloat(ingrediente.cantidad) || 0);
  }

  // ── Costo total de una receta + costo por porción ────────────
  // Si la receta tiene rendimiento_ml y tam_porcion_ml, calcula porciones reales.
  function costoReceta(receta, insumos) {
    if (!receta || !receta.ingredientes) return { ingredientes: 0, empaque: 0, total: 0, conMerma: 0, porciones: 1, costoPorcion: 0 };
    const costIng  = receta.ingredientes.reduce((s, ing) => s + costoIngrediente(ing, insumos), 0);
    const empaque  = parseFloat(receta.costo_empaque) || 0;
    const merma    = (parseFloat(receta.merma_pct) || 0) / 100;
    const subTotal = costIng + empaque;
    const conMerma = subTotal * (1 + merma);

    const rendimiento = parseFloat(receta.rendimiento_ml) || 0;
    const tamPorcion  = parseFloat(receta.tam_porcion_ml)  || 0;
    const porciones   = (rendimiento > 0 && tamPorcion > 0)
      ? Math.floor(rendimiento / tamPorcion)
      : 1;

    return {
      ingredientes: costIng,
      empaque,
      subtotal:     subTotal,
      conMerma,
      total:        conMerma,
      porciones,
      costoPorcion: porciones > 0 ? conMerma / porciones : conMerma,
    };
  }

  // ── Food cost % ───────────────────────────────────────────────
  function foodCostPct(costoTotal, pvp) {
    if (!pvp || pvp === 0) return 0;
    return (costoTotal / pvp) * 100;
  }

  // ── Margen bruto ──────────────────────────────────────────────
  function margenBruto(costo, pvp) {
    if (!pvp || pvp === 0) return 0;
    return ((pvp - costo) / pvp) * 100;
  }

  // ── PVP recomendado dado un food cost % objetivo ──────────────
  function pvpRecomendado(costo, foodCostObjPct) {
    if (!foodCostObjPct || foodCostObjPct === 0) return 0;
    return costo / (foodCostObjPct / 100);
  }

  // ── Break-even (unidades/mes) ─────────────────────────────────
  // BEP = costos_fijos / margen_contribucion_por_unidad
  function breakEvenMes(costosFijosMes, pvp, costoVariable) {
    const mc = pvp - costoVariable;
    if (mc <= 0) return Infinity;
    return costosFijosMes / mc;
  }

  // ── Clasificación de food cost % ─────────────────────────────
  function clsFood(pct, tipo) {
    // tipo: 'bebida' | 'comida'
    const limites = tipo === 'bebida'
      ? { bueno: 25, ok: 35 }
      : { bueno: 32, ok: 40 };
    if (pct <= limites.bueno) return { cls: 'green', label: '✓ Excelente' };
    if (pct <= limites.ok)    return { cls: 'yellow', label: '~ Aceptable' };
    return { cls: 'red', label: '✗ Alto — revisar precio' };
  }

  // ── Costos fijos totales ──────────────────────────────────────
  function totalCostosFijos(costos) {
    return costos.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0);
  }

  // ── Modal helper ──────────────────────────────────────────────
  function openModal(html) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    const close = () => { overlay.remove(); };
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('.modal-close')?.addEventListener('click', close);
    return { overlay, close };
  }

  // ── Colores de progreso ───────────────────────────────────────
  function progressColor(pct) {
    if (pct <= 70) return 'green';
    if (pct <= 90) return 'yellow';
    return 'red';
  }

  window.CS.Utils = {
    fmt$, fmtPct, uid,
    costoPorUnidad, costoIngrediente, costoReceta,
    foodCostPct, margenBruto, pvpRecomendado,
    breakEvenMes, clsFood, totalCostosFijos,
    openModal, progressColor,
  };
})();
