/* CandyShots — Página: Análisis por Producto */
window.CS = window.CS || {};

(function () {
  'use strict';
  const { Store, Utils } = window.CS;
  const { fmt$, fmtPct, costoReceta, foodCostPct, margenBruto, pvpRecomendado, clsFood, totalCostosFijos, breakEvenMes } = Utils;

  window.CS.renderAnalisis = function (container) {
    function render() {
      const recetas = Store.getRecetas();
      const insumos = Store.getInsumos();
      const costos  = Store.getCostos();
      const config  = Store.getConfig();
      const totalFijos = totalCostosFijos(costos);

      if (recetas.length === 0) {
        container.innerHTML = `<div class="page">
          <div class="page-title" style="margin-bottom:20px;">Análisis por Producto</div>
          <div class="empty">
            <div class="empty-icon">📊</div>
            <div class="empty-title">Sin recetas para analizar</div>
            <div class="empty-sub">Primero cargá tus insumos y armá las recetas en las secciones anteriores.</div>
          </div>
        </div>`;
        return;
      }

      // Por cada receta, renderizar su ficha de análisis
      const fichas = recetas.map(r => {
        const costs    = costoReceta(r, insumos);
        const costo    = costs.costoPorcion; // costo real por vaso/porción
        const pvpSug1  = pvpRecomendado(costo, 25); // 25% food cost
        const pvpSug2  = pvpRecomendado(costo, 30);
        const pvpSug3  = pvpRecomendado(costo, 20); // agresivo

        // Obtener PVP configurado (si existe)
        const pvpConf = config.pvp?.[r.id] || 0;
        const pvpActual = pvpConf > 0 ? pvpConf : pvpSug2;

        const fcPct   = foodCostPct(costo, pvpActual);
        const margen  = margenBruto(costo, pvpActual);
        const contrib = pvpActual - costo; // margen de contribución
        const tipo    = r.categoria?.toLowerCase().includes('comida') ? 'comida' : 'bebida';
        const cls     = clsFood(fcPct, tipo);

        // Break-even con este producto solo
        const bepMes  = totalFijos > 0 && contrib > 0 ? Math.ceil(totalFijos / contrib) : null;
        const bepDia  = bepMes ? Math.ceil(bepMes / config.dias_mes) : null;

        // Desglose de costos
        const desglose = r.ingredientes?.map(ing => {
          const ins   = insumos.find(i => i.id === ing.insumo_id);
          const cIng  = Utils.costoIngrediente(ing, insumos);
          const pct   = costo > 0 ? (cIng / costo) * 100 : 0;
          return { nombre: ins?.nombre || 'Desconocido', costo: cIng, pct };
        }).sort((a,b) => b.costo - a.costo) || [];

        return { r, costs, costo, pvpActual, fcPct, margen, contrib, cls, bepMes, bepDia, desglose, pvpSug1, pvpSug2, pvpSug3 };
      });

      container.innerHTML = `
        <div class="page">
          <div class="page-header">
            <div>
              <div class="page-title">Análisis por Producto</div>
              <div class="page-sub">Fichas técnicas de costo — ingresá el PVP real para ver el análisis completo</div>
            </div>
          </div>

          <div class="card" style="margin-bottom:20px;background:var(--surface2);border-color:var(--info-bg);">
            <p style="font-size:12.5px;color:var(--text2);line-height:1.7;">
              <strong style="color:var(--info)">Benchmarks de la industria:</strong>
              Granizados y bebidas → <strong>food cost 15–25%</strong> (margen bruto 75–85%) ·
              Comida rápida → <strong>food cost 28–35%</strong> (margen bruto 65–72%).<br>
              El <strong>margen de contribución</strong> = PVP − costo variable. Esto es lo que cubre tus gastos fijos y genera ganancia.
            </p>
          </div>

          <div style="display:flex;flex-direction:column;gap:20px;">
            ${fichas.map(f => `
              <div class="card">
                <!-- Header -->
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
                  <div>
                    <div style="font-size:16px;font-weight:800;color:var(--text);">${f.r.nombre}</div>
                    <span class="badge badge-orange">${f.r.categoria}</span>
                    ${f.costs.porciones > 1 ? `
                      <span style="font-size:11px;color:var(--muted);margin-left:8px;">
                        ${f.costs.porciones} vasos / batch · batch total ${fmt$(f.costs.total)}
                      </span>` : ''}
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:26px;font-weight:800;color:var(--accent);">${fmt$(f.costo)}</div>
                    <div style="font-size:11px;color:var(--muted);">
                      ${f.costs.porciones > 1 ? 'costo por vaso (con merma)' : 'costo por porción (con merma)'}
                    </div>
                  </div>
                </div>

                <!-- PVP input + análisis en tiempo real -->
                <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:14px;margin-bottom:16px;">
                  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                    <div class="form-row" style="flex:1;min-width:160px;margin:0;">
                      <label class="form-label">Tu PVP actual (precio de venta)</label>
                      <div class="input-group">
                        <input type="number" class="pvp-input" data-id="${f.r.id}" min="0.01" step="0.01"
                          value="${f.pvpActual > 0 ? f.pvpActual : ''}" placeholder="Ej: 3.00">
                        <span class="input-addon">USD</span>
                      </div>
                    </div>
                    <div class="pvp-result" data-id="${f.r.id}" style="flex:2;min-width:200px;">
                      ${renderPvpResult(f)}
                    </div>
                  </div>
                </div>

                <!-- PVPs sugeridos -->
                <div style="margin-bottom:16px;">
                  <p class="section-title">Precios sugeridos</p>
                  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">
                    <div class="card-sm" style="text-align:center;">
                      <div style="font-size:10px;color:var(--muted);margin-bottom:4px;">20% food cost</div>
                      <div style="font-size:18px;font-weight:800;color:var(--income);">${fmt$(f.pvpSug3)}</div>
                      <div style="font-size:10px;color:var(--muted);">margen 80%</div>
                    </div>
                    <div class="card-sm" style="text-align:center;border-color:var(--accent);">
                      <div style="font-size:10px;color:var(--muted);margin-bottom:4px;">25% food cost ⭐</div>
                      <div style="font-size:18px;font-weight:800;color:var(--accent);">${fmt$(f.pvpSug1)}</div>
                      <div style="font-size:10px;color:var(--muted);">margen 75%</div>
                    </div>
                    <div class="card-sm" style="text-align:center;">
                      <div style="font-size:10px;color:var(--muted);margin-bottom:4px;">30% food cost</div>
                      <div style="font-size:18px;font-weight:800;color:var(--text2);">${fmt$(f.pvpSug2)}</div>
                      <div style="font-size:10px;color:var(--muted);">margen 70%</div>
                    </div>
                  </div>
                </div>

                <!-- Desglose de costos -->
                <div>
                  <p class="section-title">Desglose de costos</p>
                  <div style="display:flex;flex-direction:column;gap:8px;">
                    ${f.desglose.map(d => `
                      <div>
                        <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                          <span style="font-size:12.5px;color:var(--text2);">${d.nombre}</span>
                          <span style="font-size:12.5px;font-weight:600;color:var(--text);">${fmt$(d.costo, 4)} (${d.pct.toFixed(1)}%)</span>
                        </div>
                        <div class="progress"><div class="progress-fill green" style="width:${Math.min(d.pct,100)}%"></div></div>
                      </div>
                    `).join('')}
                    ${f.costs.empaque > 0 ? `
                      <div>
                        <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                          <span style="font-size:12.5px;color:var(--text2);">Empaque (vaso+tapa+pitillo)</span>
                          <span style="font-size:12.5px;font-weight:600;color:var(--text);">${fmt$(f.costs.empaque)}</span>
                        </div>
                      </div>
                    ` : ''}
                    <div style="border-top:1px solid var(--border);padding-top:8px;display:flex;justify-content:space-between;">
                      <span style="font-size:12.5px;font-weight:700;color:var(--text2);">Total (con merma ${f.r.merma_pct||0}%)</span>
                      <span style="font-size:14px;font-weight:800;color:var(--accent);">${fmt$(f.costo)}</span>
                    </div>
                  </div>
                </div>

                <!-- Break-even -->
                ${totalFijos > 0 ? `
                  <div style="margin-top:16px;background:var(--surface2);border-radius:var(--radius-sm);padding:12px;">
                    <p style="font-size:11px;color:var(--muted);margin-bottom:6px;">
                      Si <strong>solo</strong> vendieras este producto, necesitarías ${f.bepMes ? f.bepMes.toLocaleString() : '?'} unidades/mes
                      (≈ <strong style="color:var(--warning);">${f.bepDia || '?'} por día</strong>) para cubrir todos tus costos fijos de ${fmt$(totalFijos)}/mes.
                    </p>
                    <p style="font-size:11px;color:var(--muted);">
                      En la práctica vas a vender varios productos — esta cifra se distribuye entre todos.
                    </p>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>`;

      // Inputs PVP live
      container.querySelectorAll('.pvp-input').forEach(inp => {
        inp.addEventListener('input', () => {
          const id    = inp.dataset.id;
          const pvp   = parseFloat(inp.value) || 0;
          const cfg   = Store.getConfig();
          cfg.pvp     = cfg.pvp || {};
          cfg.pvp[id] = pvp;
          Store.saveConfig(cfg);

          const ficha = fichas.find(f => f.r.id === id);
          if (ficha) {
            ficha.pvpActual = pvp;
            ficha.fcPct     = foodCostPct(ficha.costo, pvp);
            ficha.margen    = margenBruto(ficha.costo, pvp);
            ficha.contrib   = pvp - ficha.costo;
            ficha.cls       = clsFood(ficha.fcPct, ficha.r.categoria?.toLowerCase().includes('comida')?'comida':'bebida');
            const resEl = container.querySelector(`.pvp-result[data-id="${id}"]`);
            if (resEl) resEl.innerHTML = renderPvpResult(ficha);
          }
        });
      });
    }

    function renderPvpResult(f) {
      if (!f.pvpActual || f.pvpActual === 0) {
        return `<p style="font-size:12px;color:var(--muted);">Ingresá tu precio de venta para ver el análisis ↑</p>`;
      }
      return `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
          <div>
            <div style="font-size:10px;color:var(--muted);margin-bottom:2px;">Food cost %</div>
            <div style="font-size:16px;font-weight:800;" class="${f.cls.cls==='green'?'text-income':f.cls.cls==='yellow'?'text-warning':'text-danger'}">
              ${fmtPct(f.fcPct)}
            </div>
            <div style="font-size:10px;margin-top:1px;" class="${f.cls.cls==='green'?'text-income':f.cls.cls==='yellow'?'text-warning':'text-danger'}">
              ${f.cls.label}
            </div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--muted);margin-bottom:2px;">Margen bruto</div>
            <div style="font-size:16px;font-weight:800;color:var(--income);">${fmtPct(f.margen)}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--muted);margin-bottom:2px;">Ganancia/unidad</div>
            <div style="font-size:16px;font-weight:800;color:var(--income);">${fmt$(f.contrib)}</div>
          </div>
        </div>`;
    }

    render();
  };
})();
