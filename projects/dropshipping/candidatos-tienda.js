/**
 * Candidatos separados por TIENDA.
 *
 * `ranking.js` da una sola lista mezclada. Pero las dos tiendas no compiten por
 * el mismo producto: Avanora es salud/suplementos (riesgo alto en Meta, asumido
 * a propósito) y Truquito es hogar & gadgets (tiene que ser Meta-safe, ese es
 * justamente el motivo por el que existe separada — ver project_truquito).
 *
 * Un producto con etiqueta de riesgo se puede MOSTRAR en Truquito (decisión de
 * Fabián, 2026-08-29 — ver `dropi-dashboard`): quiere ver todos los ganadores
 * reales aunque toquen una categoría que Meta suele rechazar. El filtro que
 * antes los ocultaba se sacó a propósito. La etiqueta sigue viajando en cada
 * producto — es la que le avisa antes de decidir testear ahí, no un bloqueo.
 *
 * Uso:
 *   node projects/dropshipping/candidatos-tienda.js [--top 5]
 */

const { delta } = require('./catalogo');
const { evaluar, precioParaMargen } = require('./calculadora');
const { restriccion, detectarAjustesMasivos, precioObjetivo } = require('./ranking');

// Las categorías vienen del propio catálogo de DROPI (verificadas contra el
// snapshot: "Hogar" 11.7k, "Salud" 5.9k, etc.). No inventar nombres nuevos.
const CAT_AVANORA  = ['Salud', 'Bienestar', 'BIENESTAR Y SALUD'];
const CAT_TRUQUITO = ['Hogar', 'Cocina', 'Tecnologia', 'TECNOLOGÍA', 'HOGAR', 'COCINA',
                      'Aseo', 'Mascotas', 'Ferreteria', 'FERRETERIA', 'Herramientas',
                      'HERRAMIENTAS', 'Camping', 'Natural Home', 'JARDINERIA'];

// La categoría de DROPI miente seguido (hay suplementos cargados en "Hogar").
// El nombre manda: si suena a cápsula, es de Avanora aunque diga Cocina.
const SUENA_A_SALUD = /suplement|colágeno|colageno|vitamin|omega|caps\b|cápsul|capsul|gomitas|probiotic|creatina|magnesio|zinc|melatonin|ashwagandha|shilajit|inositol|clorofila|glucosamina|colirio|jarabe|gotas oral|té |teatox|infusion|infusión/i;

function clasificar(p) {
  const cats = p.categorias || [];
  const enAvanora  = cats.some(c => CAT_AVANORA.includes(c))  || SUENA_A_SALUD.test(p.name);
  const enTruquito = cats.some(c => CAT_TRUQUITO.includes(c)) && !SUENA_A_SALUD.test(p.name);
  if (enAvanora) return 'AVANORA';
  if (enTruquito) return 'TRUQUITO';
  return null;
}

function analizar({ top = 5 } = {}) {
  const d = delta();
  const ajustes = detectarAjustesMasivos(d.movimientos);
  const STOCK_MINIMO = 150;   // más alto que el de ranking.js: un test de 3 landings
                              // más un combo de 3 se come inventario rápido

  const enriquecidos = d.movimientos.map(p => {
    const precio = precioObjetivo(p.sale_price);
    const r = evaluar({ precio, costo: p.sale_price });
    return {
      ...p,
      tienda: clasificar(p),
      precioObjetivo: precio,
      multiplo: p.sale_price > 0 ? precio / p.sale_price : Infinity,
      sobreSugerido: p.suggested_price > 0 ? precio / p.suggested_price : null,
      cpaMaximo: r.cpaMaximo,
      utilidad: r.utilidadPorPedido,
      restriccion: restriccion(p),
      ajusteMasivo: ajustes.has(p.id)
    };
  });

  const base = enriquecidos.filter(p =>
    p.sale_price > 0 &&
    !p.ajusteMasivo &&
    (p.stock ?? 0) >= STOCK_MINIMO &&
    p.precioObjetivo <= 60
  );

  return {
    ventana: d,
    avanora: base.filter(p => p.tienda === 'AVANORA').slice(0, top),
    truquito: base.filter(p => p.tienda === 'TRUQUITO').slice(0, top),
    stockMinimo: STOCK_MINIMO
  };
}

const usd = n => '$' + (n || 0).toFixed(2);

function imprimirLista(titulo, lista) {
  console.log(`\n  ═══ ${titulo} ═══\n`);
  lista.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}` + (p.restriccion ? `   [⚠ Meta: ${p.restriccion.motivo}]` : ''));
    console.log(`     id ${p.id} · prov ${p.user_id} (${p.proveedor}) · stock ${p.stock} · ${p.porDia.toFixed(0)} u/día · ${(p.categorias||[]).join('/')}`);
    console.log(`     costo ${usd(p.sale_price)} · sugerido ${usd(p.suggested_price)} · VENDER A ${usd(p.precioObjetivo)} (${p.multiplo.toFixed(1)}x)`);
    console.log(`     CPA máx ${usd(p.cpaMaximo)} · utilidad ${usd(p.utilidad)}/pedido` +
      (p.sobreSugerido && p.sobreSugerido > 2.5 ? `  ⚠ ${p.sobreSugerido.toFixed(1)}x lo sugerido — validar mercado` : ''));
    console.log('');
  });
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const top = args.includes('--top') ? parseInt(args[args.indexOf('--top') + 1], 10) : 5;
  const a = analizar({ top });
  console.log(`\n  Ventana: ${a.ventana.horas.toFixed(1)}h · ${a.ventana.movimientos.length} productos con movimiento · stock mínimo ${a.stockMinimo}`);
  imprimirLista('AVANORA — salud & suplementos', a.avanora);
  imprimirLista('TRUQUITO — hogar & gadgets', a.truquito);
}

module.exports = { analizar, clasificar };
