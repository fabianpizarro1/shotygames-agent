/* CandyShots — Store (localStorage) */
window.CS = window.CS || {};

(function () {
  'use strict';

  const KEYS = {
    insumos:        'cs_insumos_v1',
    recetas:        'cs_recetas_v1',
    costos:         'cs_costos_fijos_v1',
    config:         'cs_config_v1',
    seeded:         'cs_seeded_v1',
    recetasSeeded:  'cs_recetas_seeded_v1',
  };

  function load(k)    { try { const r=localStorage.getItem(k); return r?JSON.parse(r):null; } catch { return null; } }
  function save(k, d) { localStorage.setItem(k, JSON.stringify(d)); }
  function uid()      { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

  // ── Seed: insumos reales de CandyShots (precios del 30/05/2026) ──────────
  function seedInsumos() {
    if (load(KEYS.seeded)) return; // ya está cargado

    const ins = [
      // ─── Lácteos ──────────────────────────────────────────────
      { id:uid(), nombre:'Leche condensada Gloria',    categoria:'Lácteos',            unidad:'g',   cantidad_paquete: 395,  precio_paquete: 1.80 },
      { id:uid(), nombre:'Leche líquida Parmalat',     categoria:'Lácteos',            unidad:'ml',  cantidad_paquete: 6000, precio_paquete: 5.88 },
      { id:uid(), nombre:'Leche en polvo La Vaquita',  categoria:'Lácteos',            unidad:'g',   cantidad_paquete: 1000, precio_paquete: 8.55 },
      { id:uid(), nombre:'Leche de coco AGRODELY',     categoria:'Lácteos',            unidad:'ml',  cantidad_paquete: 500,  precio_paquete: 2.70 },
      { id:uid(), nombre:'Garras de leche (x3, 2L)',   categoria:'Lácteos',            unidad:'ml',  cantidad_paquete: 2000, precio_paquete: 2.36 },
      { id:uid(), nombre:'Coffee Mate AKI',            categoria:'Lácteos',            unidad:'g',   cantidad_paquete: 300,  precio_paquete: 3.05 },

      // ─── Bases / Sabores ──────────────────────────────────────
      { id:uid(), nombre:'Cacao y avellana (Nutella)', categoria:'Bases',              unidad:'g',   cantidad_paquete: 350,  precio_paquete: 2.92 },
      { id:uid(), nombre:'Cocoa LA ORIGINAL',          categoria:'Bases',              unidad:'g',   cantidad_paquete: 400,  precio_paquete: 1.00 },
      { id:uid(), nombre:'Café ESY liofilizado',       categoria:'Bases',              unidad:'g',   cantidad_paquete: 85,   precio_paquete: 1.98 },
      { id:uid(), nombre:'Azúcar',                     categoria:'Condimentos',        unidad:'g',   cantidad_paquete: 1000, precio_paquete: 0.86 },

      // ─── Jarabes y siropes ────────────────────────────────────
      { id:uid(), nombre:'Sirope chocolate CONDIMENSA',categoria:'Jarabes/Saborizantes',unidad:'ml', cantidad_paquete: 200,  precio_paquete: 1.28 },

      // ─── Pulpas de fruta ──────────────────────────────────────
      { id:uid(), nombre:'Pulpa maracuyá LA ORIGINAL', categoria:'Jarabes/Saborizantes',unidad:'g',  cantidad_paquete: 500,  precio_paquete: 2.59 },
      { id:uid(), nombre:'Pulpa de mora LA ORIGINAL',  categoria:'Jarabes/Saborizantes',unidad:'g',  cantidad_paquete: 375,  precio_paquete: 1.08 },
      { id:uid(), nombre:'Pulpa de fresa FRUTA SI',    categoria:'Jarabes/Saborizantes',unidad:'g',  cantidad_paquete: 500,  precio_paquete: 1.89 },

      // ─── Frutas frescas ───────────────────────────────────────
      { id:uid(), nombre:'Naranja',                    categoria:'Bases',              unidad:'und', cantidad_paquete: 50,   precio_paquete: 3.00 },
      { id:uid(), nombre:'Fresa fresca (libra)',       categoria:'Bases',              unidad:'g',   cantidad_paquete: 454,  precio_paquete: 1.00 },
        // nota: el $1.00 incluye la fresa + 2 maracuyás — precio aprox de la fresa sola

      // ─── Toppings ────────────────────────────────────────────
      { id:uid(), nombre:'Galletas Oreo',              categoria:'Toppings',           unidad:'und', cantidad_paquete: 18,   precio_paquete: 4.18 },
      { id:uid(), nombre:'Coco rallado',               categoria:'Toppings',           unidad:'g',   cantidad_paquete: 80,   precio_paquete: 1.33 },
      { id:uid(), nombre:'Gomitas (decoración)',       categoria:'Toppings',           unidad:'und', cantidad_paquete: 100,  precio_paquete: 10.00 },
        // 100 como aproximado — ajustar cuando sepas cuántas trae el lote

      // ─── Hielo ───────────────────────────────────────────────
      { id:uid(), nombre:'Hielo AKI',                  categoria:'Bases',              unidad:'g',   cantidad_paquete: 3000, precio_paquete: 1.00 },
    ];

    save(KEYS.insumos, ins);
    save(KEYS.seeded, true);
  }

  // ── Seed: recetas iniciales ───────────────────────────────────────────────
  function seedRecetas() {
    if (load(KEYS.recetasSeeded)) return;

    const insumos = load(KEYS.insumos) || [];
    function findId(substr) {
      const ins = insumos.find(i => i.nombre.toLowerCase().includes(substr.toLowerCase()));
      return ins ? ins.id : null;
    }

    const idAzucar    = findId('Azúcar');
    const idCondensada= findId('condensada');
    const idPolvo     = findId('en polvo');
    const idMaracuya  = findId('maracuyá');

    if (!idAzucar || !idCondensada || !idPolvo || !idMaracuya) return;

    const existing = load(KEYS.recetas) || [];
    if (existing.length === 0) {
      save(KEYS.recetas, [{
        id:           uid(),
        nombre:       'Granizado de Maracuyá (Máquina)',
        categoria:    'Granizado Máquina',
        ingredientes: [
          { insumo_id: idAzucar,     cantidad: 1000 }, // 1 kg azúcar
          { insumo_id: idCondensada, cantidad: 395  }, // 1 bote (395g)
          { insumo_id: idPolvo,      cantidad: 45   }, // 6 cucharadas ≈ 45g
          { insumo_id: idMaracuya,   cantidad: 1000 }, // 2 fundas × 500g
        ],
        costo_empaque:  0,
        merma_pct:      5,
        rendimiento_ml: 7000, // 7 litros totales (mezcla + agua)
        tam_porcion_ml: 355,  // vaso 12 oz = 355 ml → 19 vasos por batch
      }]);
    }
    save(KEYS.recetasSeeded, true);
  }

  window.CS.Store = {
    // ── Insumos ──────────────────────────────────────────────────
    getInsumos()    { return load(KEYS.insumos) || []; },
    saveInsumos(v)  { save(KEYS.insumos, v); },
    addInsumo(i)    { const l=this.getInsumos(); l.push(i); this.saveInsumos(l); },
    updateInsumo(u) { this.saveInsumos(this.getInsumos().map(i=>i.id===u.id?u:i)); },
    deleteInsumo(id){ this.saveInsumos(this.getInsumos().filter(i=>i.id!==id)); },

    // ── Recetas ──────────────────────────────────────────────────
    getRecetas()    { return load(KEYS.recetas) || []; },
    saveRecetas(v)  { save(KEYS.recetas, v); },
    addReceta(r)    { const l=this.getRecetas(); l.push(r); this.saveRecetas(l); },
    updateReceta(u) { this.saveRecetas(this.getRecetas().map(r=>r.id===u.id?u:r)); },
    deleteReceta(id){ this.saveRecetas(this.getRecetas().filter(r=>r.id!==id)); },

    // ── Costos fijos ─────────────────────────────────────────────
    getCostos()    { return load(KEYS.costos) || []; },
    saveCostos(v)  { save(KEYS.costos, v); },
    addCosto(c)    { const l=this.getCostos(); l.push(c); this.saveCostos(l); },
    updateCosto(u) { this.saveCostos(this.getCostos().map(c=>c.id===u.id?u:c)); },
    deleteCosto(id){ this.saveCostos(this.getCostos().filter(c=>c.id!==id)); },

    // ── Configuración ────────────────────────────────────────────
    getConfig() {
      return load(KEYS.config) || {
        dias_mes:     26,
        unidades_dia: {},
        margen_obj:   0.70,
      };
    },
    saveConfig(c) { save(KEYS.config, c); },

    // ── Init ─────────────────────────────────────────────────────
    init() { seedInsumos(); seedRecetas(); },
  };
})();
