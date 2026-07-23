/* CandyShots — Página: Costos Fijos */
window.CS = window.CS || {};

(function () {
  'use strict';
  const { Store, Utils } = window.CS;
  const { fmt$, uid, totalCostosFijos } = Utils;

  const CATEGORIAS = ['Arriendo', 'Servicios básicos', 'Sueldos', 'Publicidad', 'Insumos/Inventario', 'Equipos', 'Otros'];

  function openForm(existing, onSave) {
    const isEdit = !!existing;
    const v = f => existing?.[f] ?? '';
    const catOpts = CATEGORIAS.map(c => `<option value="${c}" ${v('categoria')===c?'selected':''}>${c}</option>`).join('');

    const html = `
      <div class="modal" style="max-width:420px;">
        <span class="modal-handle"></span>
        <div class="modal-header">
          <span class="modal-title">${isEdit ? 'Editar costo' : 'Nuevo costo fijo'}</span>
          <button class="btn-icon modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label class="form-label">Concepto *</label>
            <input id="f-nombre" value="${v('nombre')}" placeholder="Ej: Arriendo local, Sueldo Nerea">
          </div>
          <div class="form-row">
            <label class="form-label">Categoría</label>
            <select id="f-cat">${catOpts}</select>
          </div>
          <div class="form-row">
            <label class="form-label">Monto mensual ($) *</label>
            <div class="input-group">
              <input id="f-monto" type="number" min="0.01" step="0.01" value="${v('monto')}" placeholder="300.00">
              <span class="input-addon">USD/mes</span>
            </div>
          </div>
          <div class="form-row">
            <label class="form-label">Notas (opcional)</label>
            <input id="f-notas" value="${v('notas') || ''}" placeholder="Ej: Incluye luz y agua">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost modal-close">Cancelar</button>
          <button class="btn btn-primary" id="btn-save">${isEdit ? 'Guardar' : '+ Agregar'}</button>
        </div>
      </div>`;

    const { overlay, close } = Utils.openModal(html);
    overlay.querySelector('#btn-save').addEventListener('click', () => {
      const nombre = overlay.querySelector('#f-nombre').value.trim();
      const monto  = parseFloat(overlay.querySelector('#f-monto').value);
      if (!nombre) return alert('Ingresa el concepto');
      if (!monto || monto <= 0) return alert('Ingresa un monto válido');
      const costo = {
        id:        isEdit ? existing.id : uid(),
        nombre,
        categoria: overlay.querySelector('#f-cat').value,
        monto,
        notas:     overlay.querySelector('#f-notas').value.trim(),
      };
      if (isEdit) Store.updateCosto(costo); else Store.addCosto(costo);
      close();
      onSave();
    });
  }

  window.CS.renderCostos = function (container) {
    function render() {
      const costos  = Store.getCostos();
      const config  = Store.getConfig();
      const total   = totalCostosFijos(costos);
      const porDia  = config.dias_mes > 0 ? total / config.dias_mes : 0;

      // Agrupar por categoría
      const grupos = {};
      costos.forEach(c => {
        const cat = c.categoria || 'Otros';
        if (!grupos[cat]) grupos[cat] = [];
        grupos[cat].push(c);
      });

      container.innerHTML = `
        <div class="page">
          <div class="page-header">
            <div>
              <div class="page-title">Costos Fijos</div>
              <div class="page-sub">Lo que pagás todos los meses, vendas o no vendas</div>
            </div>
            <button class="btn btn-primary" id="btn-new">+ Agregar costo</button>
          </div>

          <!-- Configuración del mes -->
          <div class="card" style="margin-bottom:20px;">
            <p class="section-title">Configuración</p>
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
              <div class="form-row" style="flex:1;min-width:180px;margin:0;">
                <label class="form-label">Días abiertos por mes</label>
                <div class="input-group">
                  <input id="inp-dias" type="number" min="1" max="31" step="1" value="${config.dias_mes}" style="max-width:80px;">
                  <span class="input-addon">días</span>
                </div>
              </div>
              <div style="flex:2;">
                <p style="font-size:12px;color:var(--muted);">
                  Si abrís ${config.dias_mes} días/mes y tenés ${fmt$(total)} en costos fijos,
                  cada día que abrís cuesta <strong style="color:var(--warning);">${fmt$(porDia)}</strong> antes de vender un solo producto.
                </p>
              </div>
            </div>
          </div>

          <!-- Totales -->
          ${total > 0 ? `
            <div class="metric-grid" style="margin-bottom:20px;">
              <div class="metric-card">
                <div class="metric-label">Total mensual</div>
                <div class="metric-val red">${fmt$(total)}</div>
                <div class="metric-sub">Gasto fijo por mes</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Costo por día</div>
                <div class="metric-val yellow">${fmt$(porDia)}</div>
                <div class="metric-sub">Asumiendo ${config.dias_mes} días abiertos</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Conceptos</div>
                <div class="metric-val orange">${costos.length}</div>
                <div class="metric-sub">Costos registrados</div>
              </div>
            </div>
          ` : ''}

          <!-- Lista -->
          ${costos.length === 0 ? `
            <div class="empty">
              <div class="empty-icon">💰</div>
              <div class="empty-title">Sin costos fijos registrados</div>
              <div class="empty-sub">Agregá arriendo, servicios básicos, sueldos, publicidad, etc.</div>
            </div>
          ` : `
            <div style="display:flex;flex-direction:column;gap:16px;">
              ${Object.entries(grupos).map(([cat, items]) => `
                <div>
                  <p class="section-title">${cat}</p>
                  <div class="tbl-wrap">
                    <table>
                      <thead><tr><th>Concepto</th><th>Notas</th><th class="right">$/mes</th><th></th></tr></thead>
                      <tbody>
                        ${items.map(c => `<tr>
                          <td class="primary">${c.nombre}</td>
                          <td class="text-muted" style="font-size:12px;">${c.notas || '—'}</td>
                          <td class="right text-danger">${fmt$(c.monto)}</td>
                          <td>
                            <div style="display:flex;gap:6px;justify-content:flex-end;">
                              <button class="btn-icon btn-edit" data-id="${c.id}">✎</button>
                              <button class="btn-icon danger btn-del" data-id="${c.id}">✕</button>
                            </div>
                          </td>
                        </tr>`).join('')}
                        <tr style="font-weight:700;">
                          <td colspan="2" style="color:var(--muted);font-size:12px;">Subtotal ${cat}</td>
                          <td class="right text-danger">${fmt$(items.reduce((s,c)=>s+(parseFloat(c.monto)||0),0))}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              `).join('')}
              <div class="card" style="background:var(--danger-bg);border-color:var(--danger);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-size:14px;font-weight:700;color:var(--danger);">TOTAL COSTOS FIJOS/MES</span>
                  <span style="font-size:24px;font-weight:800;color:var(--danger);">${fmt$(total)}</span>
                </div>
              </div>
            </div>
          `}
        </div>`;

      // Días input
      container.querySelector('#inp-dias')?.addEventListener('change', e => {
        const cfg = Store.getConfig();
        cfg.dias_mes = parseInt(e.target.value) || 26;
        Store.saveConfig(cfg);
        render();
      });

      container.querySelector('#btn-new').addEventListener('click', () => openForm(null, render));
      container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const c = Store.getCostos().find(x => x.id === btn.dataset.id);
          if (c) openForm(c, render);
        });
      });
      container.querySelectorAll('.btn-del').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('¿Eliminar este costo?')) { Store.deleteCosto(btn.dataset.id); render(); }
        });
      });
    }
    render();
  };
})();
