/* CandyShots — Página: Recetas */
window.CS = window.CS || {};

(function () {
  'use strict';
  const { Store, Utils } = window.CS;
  const { fmt$, fmtPct, uid, costoIngrediente, costoReceta, costoPorUnidad, foodCostPct, margenBruto, pvpRecomendado, clsFood } = Utils;

  const CATEGORIAS = ['Granizado Máquina', 'Granizado Especial', 'Comida', 'Bebida', 'Otro'];

  function unitLabel(u) {
    const m = { g:'g', ml:'ml', und:'und', kg:'g', L:'ml' };
    return m[u] || u;
  }

  function buildIngRow(ing, insumos, idx) {
    const ins    = insumos.find(i => i.id === ing.insumo_id);
    const cost   = costoIngrediente(ing, insumos);
    const ul     = ins ? unitLabel(ins.unidad) : '';
    const opts   = insumos.map(i => `<option value="${i.id}" ${i.id===ing.insumo_id?'selected':''}>${i.nombre} (${i.unidad})</option>`).join('');

    return `<div class="ing-row" data-idx="${idx}">
      <select class="ing-select" style="font-size:13px;">
        <option value="">-- Selecciona insumo --</option>
        ${opts}
      </select>
      <div class="input-group">
        <input type="number" class="ing-cant" min="0.01" step="any" value="${ing.cantidad || ''}" placeholder="0" style="border-radius:var(--radius-sm);font-size:13px;">
        <span class="input-addon" style="font-size:11px;">${ul}</span>
      </div>
      <span class="ing-cost">${cost > 0 ? fmt$(cost, 4) : '—'}</span>
      <button class="btn-icon danger ing-del" title="Quitar">✕</button>
    </div>`;
  }

  function openForm(existing, onSave) {
    const isEdit    = !!existing;
    const insumos   = Store.getInsumos();
    let ingredientes = existing?.ingredientes ? JSON.parse(JSON.stringify(existing.ingredientes)) : [{ insumo_id:'', cantidad:'' }];

    const catOpts = CATEGORIAS.map(c => `<option value="${c}" ${existing?.categoria===c?'selected':''}>${c}</option>`).join('');

    const html = `
      <div class="modal" style="max-width:600px;">
        <span class="modal-handle"></span>
        <div class="modal-header">
          <span class="modal-title">${isEdit ? 'Editar receta' : 'Nueva receta'}</span>
          <button class="btn-icon modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid-2">
            <div class="form-row">
              <label class="form-label">Nombre del producto *</label>
              <input id="f-nombre" value="${existing?.nombre || ''}" placeholder="Ej: Granizado Oreo">
            </div>
            <div class="form-row">
              <label class="form-label">Categoría</label>
              <select id="f-cat">${catOpts}</select>
            </div>
          </div>

          <hr class="divider">
          <p class="section-title">Ingredientes</p>
          <div id="ing-list"></div>
          <button class="btn btn-ghost btn-sm" id="btn-add-ing" style="margin-top:10px;">
            + Agregar ingrediente
          </button>

          <hr class="divider" style="margin-top:16px;">
          <div class="form-grid-2">
            <div class="form-row">
              <label class="form-label">Costo de empaque ($)</label>
              <div class="input-group">
                <input id="f-empaque" type="number" min="0" step="0.01" value="${existing?.costo_empaque || ''}" placeholder="0.12">
                <span class="input-addon">USD</span>
              </div>
              <span class="form-hint">Vaso + tapa + pitillo + servilleta</span>
            </div>
            <div class="form-row">
              <label class="form-label">Factor merma (%)</label>
              <div class="input-group">
                <input id="f-merma" type="number" min="0" max="50" step="1" value="${existing?.merma_pct || 5}" placeholder="5">
                <span class="input-addon">%</span>
              </div>
              <span class="form-hint">Desperdicio/derrames. 5–10% típico</span>
            </div>
          </div>

          <hr class="divider" style="margin-top:16px;">
          <p class="section-title">Rendimiento del batch</p>
          <div class="form-grid-2">
            <div class="form-row">
              <label class="form-label">Mezcla total del batch</label>
              <div style="display:flex;gap:8px;">
                <div class="input-group" style="flex:1;">
                  <input id="f-litros" type="number" min="0" step="0.5"
                    value="${existing?.rendimiento_ml ? (existing.rendimiento_ml / 1000) : ''}"
                    placeholder="7">
                  <span class="input-addon">L</span>
                </div>
                <div class="input-group" style="flex:1;">
                  <input id="f-rendimiento" type="number" min="0" step="1"
                    value="${existing?.rendimiento_ml || ''}"
                    placeholder="7000">
                  <span class="input-addon">ml</span>
                </div>
              </div>
              <span class="form-hint">Entrá en litros o ml — se sincronizan</span>
            </div>
            <div class="form-row">
              <label class="form-label">Tamaño del vaso <span style="font-size:10px;background:var(--accent);color:#fff;padding:1px 6px;border-radius:20px;margin-left:4px;">tu estándar</span></label>
              <div class="input-group">
                <input id="f-porcion" type="number" min="1" step="1"
                  value="${existing?.tam_porcion_ml || 355}"
                  placeholder="355">
                <span class="input-addon">ml</span>
              </div>
              <span class="form-hint">12 oz = 355 ml · 16 oz = 473 ml</span>
            </div>
          </div>

          <hr class="divider">
          <div id="cost-summary" style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;font-size:13px;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost modal-close">Cancelar</button>
          <button class="btn btn-primary" id="btn-save">${isEdit ? 'Guardar' : '+ Crear receta'}</button>
        </div>
      </div>`;

    const { overlay, close } = Utils.openModal(html);
    const ingList = overlay.querySelector('#ing-list');

    function getIngredientesFromDOM() {
      const rows = ingList.querySelectorAll('.ing-row');
      return Array.from(rows).map(row => ({
        insumo_id: row.querySelector('.ing-select').value,
        cantidad:  parseFloat(row.querySelector('.ing-cant').value) || 0,
      })).filter(i => i.insumo_id && i.cantidad > 0);
    }

    function updateCosts() {
      // Actualizar costos individuales en la vista
      const rows = ingList.querySelectorAll('.ing-row');
      rows.forEach(row => {
        const insId = row.querySelector('.ing-select').value;
        const cant  = parseFloat(row.querySelector('.ing-cant').value) || 0;
        const ing   = { insumo_id: insId, cantidad: cant };
        const cost  = costoIngrediente(ing, insumos);
        const costEl= row.querySelector('.ing-cost');
        if (costEl) costEl.textContent = (cost > 0 && insId) ? fmt$(cost, 4) : '—';

        const addon = row.querySelector('.input-addon');
        if (addon) {
          const ins = insumos.find(i => i.id === insId);
          addon.textContent = ins ? unitLabel(ins.unidad) : '';
        }
      });

      const ings        = getIngredientesFromDOM();
      const empaque     = parseFloat(overlay.querySelector('#f-empaque').value)    || 0;
      const merma       = parseFloat(overlay.querySelector('#f-merma').value)      || 0;
      const rendimiento = parseFloat(overlay.querySelector('#f-rendimiento').value)|| 0;
      const tamPorcion  = parseFloat(overlay.querySelector('#f-porcion').value)    || 0;
      const tmpReceta   = { ingredientes: ings, costo_empaque: empaque, merma_pct: merma, rendimiento_ml: rendimiento, tam_porcion_ml: tamPorcion };
      const costs       = costoReceta(tmpReceta, insumos);
      const tieneRend   = rendimiento > 0 && tamPorcion > 0;

      const sumEl = overlay.querySelector('#cost-summary');
      sumEl.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div>
            <div style="color:var(--muted);font-size:11px;margin-bottom:2px;">Ingredientes</div>
            <div style="font-weight:700;color:var(--text);">${fmt$(costs.ingredientes)}</div>
          </div>
          <div>
            <div style="color:var(--muted);font-size:11px;margin-bottom:2px;">Empaque</div>
            <div style="font-weight:700;color:var(--text);">${fmt$(costs.empaque)}</div>
          </div>
          <div>
            <div style="color:var(--muted);font-size:11px;margin-bottom:2px;">+ Merma (${merma}%)</div>
            <div style="font-weight:700;color:var(--text);">${fmt$(costs.conMerma - costs.subtotal)}</div>
          </div>
          <div>
            <div style="color:var(--muted);font-size:11px;margin-bottom:2px;">COSTO TOTAL BATCH</div>
            <div style="font-weight:800;font-size:18px;color:var(--accent);">${fmt$(costs.total)}</div>
          </div>
          ${tieneRend ? `
          <div>
            <div style="color:var(--muted);font-size:11px;margin-bottom:2px;">Vasos por batch</div>
            <div style="font-weight:700;color:var(--text);">${costs.porciones} vasos</div>
          </div>
          <div>
            <div style="color:var(--muted);font-size:11px;margin-bottom:2px;">COSTO POR VASO</div>
            <div style="font-weight:800;font-size:18px;color:var(--income);">${fmt$(costs.costoPorcion)}</div>
          </div>` : ''}
        </div>
        ${costs.costoPorcion > 0 ? `
          <hr class="divider" style="margin:10px 0;">
          <div style="font-size:11.5px;color:var(--text2);">
            PVP recomendado con 25% food cost: <strong style="color:var(--income);">${fmt$(costs.costoPorcion / 0.25)}</strong> &nbsp;|&nbsp;
            con 30%: <strong style="color:var(--income);">${fmt$(costs.costoPorcion / 0.30)}</strong>
          </div>
        ` : ''}
      `;
    }

    function renderIngList() {
      ingList.innerHTML = ingredientes.map((ing, i) => buildIngRow(ing, insumos, i)).join('');
      ingList.querySelectorAll('.ing-del').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.closest('[data-idx]').dataset.idx);
          ingredientes.splice(idx, 1);
          if (ingredientes.length === 0) ingredientes.push({ insumo_id:'', cantidad:'' });
          renderIngList();
          updateCosts();
        });
      });
      ingList.querySelectorAll('.ing-select').forEach((sel, i) => {
        sel.addEventListener('change', () => { ingredientes[i].insumo_id = sel.value; updateCosts(); });
      });
      ingList.querySelectorAll('.ing-cant').forEach((inp, i) => {
        inp.addEventListener('input', () => { ingredientes[i].cantidad = parseFloat(inp.value) || 0; updateCosts(); });
      });
      updateCosts();
    }

    renderIngList();
    overlay.querySelector('#f-empaque').addEventListener('input', updateCosts);
    overlay.querySelector('#f-merma').addEventListener('input', updateCosts);
    overlay.querySelector('#f-porcion').addEventListener('input', updateCosts);

    // Sincronizar litros ↔ ml
    overlay.querySelector('#f-litros').addEventListener('input', e => {
      const l = parseFloat(e.target.value);
      const mlInput = overlay.querySelector('#f-rendimiento');
      mlInput.value = isNaN(l) ? '' : Math.round(l * 1000);
      updateCosts();
    });
    overlay.querySelector('#f-rendimiento').addEventListener('input', e => {
      const ml = parseFloat(e.target.value);
      const lInput = overlay.querySelector('#f-litros');
      lInput.value = isNaN(ml) ? '' : (ml / 1000).toFixed(2).replace(/\.?0+$/, '');
      updateCosts();
    });

    overlay.querySelector('#btn-add-ing').addEventListener('click', () => {
      ingredientes.push({ insumo_id:'', cantidad:'' });
      renderIngList();
    });

    overlay.querySelector('#btn-save').addEventListener('click', () => {
      const nombre = overlay.querySelector('#f-nombre').value.trim();
      if (!nombre) return alert('Ingresa el nombre de la receta');
      const ings = getIngredientesFromDOM();
      const receta = {
        id:             isEdit ? existing.id : uid(),
        nombre,
        categoria:      overlay.querySelector('#f-cat').value,
        ingredientes:   ings,
        costo_empaque:  parseFloat(overlay.querySelector('#f-empaque').value)    || 0,
        merma_pct:      parseFloat(overlay.querySelector('#f-merma').value)      || 0,
        rendimiento_ml: parseFloat(overlay.querySelector('#f-rendimiento').value)|| 0,
        tam_porcion_ml: parseFloat(overlay.querySelector('#f-porcion').value)    || 0,
      };
      if (isEdit) Store.updateReceta(receta); else Store.addReceta(receta);
      close();
      onSave();
    });
  }

  function renderUtilidad(pvp, costs) {
    if (!pvp || pvp <= 0) {
      return `<p style="font-size:12px;color:var(--muted);">Ingresá el PVP por vaso ←</p>`;
    }
    const utilVaso   = pvp - costs.costoPorcion;
    const utilMezcla = costs.porciones > 1 ? utilVaso * costs.porciones : utilVaso;
    const margen     = pvp > 0 ? ((utilVaso / pvp) * 100) : 0;
    const color      = margen >= 60 ? 'var(--income)' : margen >= 40 ? 'var(--warning)' : 'var(--danger)';
    const isBatch    = costs.porciones > 1;
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr${isBatch ? ' 1fr' : ''};gap:10px;">
        <div>
          <div style="font-size:10px;color:var(--muted);margin-bottom:2px;text-transform:uppercase;letter-spacing:.5px;">Ganancia / vaso</div>
          <div style="font-size:22px;font-weight:800;color:${color};">${fmt$(utilVaso)}</div>
        </div>
        <div>
          <div style="font-size:10px;color:var(--muted);margin-bottom:2px;text-transform:uppercase;letter-spacing:.5px;">Margen</div>
          <div style="font-size:22px;font-weight:800;color:${color};">${margen.toFixed(1)}%</div>
        </div>
        ${isBatch ? `
        <div>
          <div style="font-size:10px;color:var(--muted);margin-bottom:2px;text-transform:uppercase;letter-spacing:.5px;">Ganancia / mezcla</div>
          <div style="font-size:22px;font-weight:800;color:${color};">${fmt$(utilMezcla)}</div>
          <div style="font-size:10px;color:var(--muted);">${costs.porciones} vasos × ${fmt$(utilVaso)}</div>
        </div>` : ''}
      </div>`;
  }

  window.CS.renderRecetas = function (container) {
    function render() {
      const recetas = Store.getRecetas();
      const insumos = Store.getInsumos();
      const config  = Store.getConfig();
      const pvps    = config.pvp || {};

      container.innerHTML = `
        <div class="page">
          <div class="page-header">
            <div>
              <div class="page-title">Recetas</div>
              <div class="page-sub">${recetas.length} receta${recetas.length !== 1 ? 's' : ''}</div>
            </div>
            <button class="btn btn-primary" id="btn-new">+ Nueva receta</button>
          </div>

          ${insumos.length === 0 ? `
            <div class="card" style="background:var(--warning-bg);border-color:var(--warning);">
              <p style="font-size:13px;color:var(--warning);">⚠️ Primero necesitás registrar tus <strong>insumos</strong> en la sección Insumos.</p>
            </div>
          ` : ''}

          ${recetas.length === 0 ? `
            <div class="empty" style="margin-top:20px;">
              <div class="empty-icon">📋</div>
              <div class="empty-title">Sin recetas todavía</div>
              <div class="empty-sub">Armá la ficha de cada producto para ver su costo y utilidad.</div>
            </div>
          ` : `
            <div style="display:flex;flex-direction:column;gap:16px;">
              ${recetas.map(r => {
                const costs  = costoReceta(r, insumos);
                const pvp    = parseFloat(pvps[r.id]) || 0;
                const isBatch = costs.porciones > 1;
                return `
                  <div class="card" data-receta-id="${r.id}">

                    <!-- Nombre + acciones -->
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap;">
                      <div>
                        <div style="font-size:16px;font-weight:800;color:var(--text);">${r.nombre}</div>
                        <span class="badge badge-orange" style="font-size:10px;">${r.categoria}</span>
                        <span style="font-size:11px;color:var(--muted);margin-left:8px;">${r.ingredientes?.length || 0} ingredientes</span>
                      </div>
                      <div style="display:flex;gap:8px;">
                        <button class="btn btn-ghost btn-sm btn-edit" data-id="${r.id}">Editar</button>
                        <button class="btn-icon danger btn-del" data-id="${r.id}" title="Eliminar">✕</button>
                      </div>
                    </div>

                    <!-- Métricas principales por VASO -->
                    <div style="display:grid;grid-template-columns:1fr 1fr${isBatch ? ' 1fr' : ''};gap:10px;margin-bottom:14px;">
                      <div style="padding:14px;background:var(--surface2);border-radius:var(--radius-sm);border:2px solid var(--accent);">
                        <div style="font-size:10px;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">Costo / vaso</div>
                        <div style="font-size:26px;font-weight:800;color:var(--accent);">${fmt$(costs.costoPorcion)}</div>
                        <div style="font-size:10px;color:var(--muted);">${r.tam_porcion_ml || 355}ml · ${Math.round((r.tam_porcion_ml||355)/29.57)}oz</div>
                      </div>
                      ${isBatch ? `
                      <div style="padding:14px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);">
                        <div style="font-size:10px;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">Vasos por mezcla</div>
                        <div style="font-size:26px;font-weight:800;color:var(--text);">${costs.porciones}</div>
                        <div style="font-size:10px;color:var(--muted);">mezcla total: ${fmt$(costs.total)}</div>
                      </div>` : ''}
                      <div style="padding:14px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);">
                        <div style="font-size:10px;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">PVP sugerido/vaso</div>
                        <div style="font-size:26px;font-weight:800;color:var(--income);">${fmt$(costs.costoPorcion / 0.25)}</div>
                        <div style="font-size:10px;color:var(--muted);">con 25% food cost</div>
                      </div>
                    </div>

                    <!-- PVP real + utilidad por vaso -->
                    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;">
                      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
                        <div style="flex:0 0 auto;">
                          <div style="font-size:10px;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">Tu PVP por vaso</div>
                          <div class="input-group" style="max-width:140px;">
                            <input type="number" class="pvp-card-input" data-id="${r.id}"
                              min="0.01" step="0.01" value="${pvp > 0 ? pvp : ''}"
                              placeholder="0.00" style="font-size:18px;font-weight:800;">
                            <span class="input-addon">USD</span>
                          </div>
                        </div>
                        <div class="utilidad-panel" data-id="${r.id}" style="flex:1;">
                          ${renderUtilidad(pvp, costs)}
                        </div>
                      </div>
                    </div>

                  </div>`;
              }).join('')}
            </div>
          `}
        </div>`;

      container.querySelector('#btn-new').addEventListener('click', () => openForm(null, render));

      container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = Store.getRecetas().find(x => x.id === btn.dataset.id);
          if (r) openForm(r, render);
        });
      });

      container.querySelectorAll('.btn-del').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('¿Eliminar esta receta?')) { Store.deleteReceta(btn.dataset.id); render(); }
        });
      });

      container.querySelectorAll('.pvp-card-input').forEach(inp => {
        inp.addEventListener('input', () => {
          const id     = inp.dataset.id;
          const pvp    = parseFloat(inp.value) || 0;
          const cfg    = Store.getConfig();
          cfg.pvp      = cfg.pvp || {};
          cfg.pvp[id]  = pvp;
          Store.saveConfig(cfg);
          const receta = Store.getRecetas().find(r => r.id === id);
          const costs  = costoReceta(receta, insumos);
          const panel  = container.querySelector(`.utilidad-panel[data-id="${id}"]`);
          if (panel) panel.innerHTML = renderUtilidad(pvp, costs);
        });
      });
    }
    render();
  };
})();
