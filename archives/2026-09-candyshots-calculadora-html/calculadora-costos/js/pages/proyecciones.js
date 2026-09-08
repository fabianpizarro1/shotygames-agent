/* CandyShots — Página: Proyecciones */
window.CS = window.CS || {};

(function () {
  'use strict';
  const { Store, Utils } = window.CS;
  const { fmt$, fmtPct, costoReceta, totalCostosFijos, breakEvenMes } = Utils;

  window.CS.renderProyecciones = function (container) {
    function render() {
      const recetas   = Store.getRecetas();
      const insumos   = Store.getInsumos();
      const costos    = Store.getCostos();
      const config    = Store.getConfig();
      const fijos     = totalCostosFijos(costos);
      const diasMes   = config.dias_mes || 26;

      if (recetas.length === 0 || costos.length === 0) {
        container.innerHTML = `<div class="page">
          <div class="page-title" style="margin-bottom:20px;">Proyecciones</div>
          <div class="empty">
            <div class="empty-icon">📈</div>
            <div class="empty-title">Faltan datos</div>
            <div class="empty-sub">Necesitás tener al menos una receta con costo y tus costos fijos cargados.</div>
          </div>
        </div>`;
        return;
      }

      // Construir estado de ventas por receta
      const unidades = config.unidades_dia || {};
      const pvps     = config.pvp          || {};

      // Calcular métricas globales con los valores actuales
      function calcProjection(multiplicador) {
        let ingresoTotal = 0, costoVarTotal = 0;
        recetas.forEach(r => {
          const ud    = (parseFloat(unidades[r.id]) || 0) * multiplicador;
          const pvp   = parseFloat(pvps[r.id]) || 0;
          const costs = costoReceta(r, insumos);
          ingresoTotal  += ud * diasMes * pvp;
          costoVarTotal += ud * diasMes * costs.costoPorcion;
        });
        const utilidad = ingresoTotal - costoVarTotal - fijos;
        return { ingresos: ingresoTotal, costosVar: costoVarTotal, fijos, utilidad };
      }

      const pRealista  = calcProjection(1);
      const pPesimista = calcProjection(0.6);
      const pOptimista = calcProjection(1.5);

      // Break-even diario total
      let contribucionTotal = 0;
      let ingresoDia = 0;
      recetas.forEach(r => {
        const ud     = parseFloat(unidades[r.id]) || 0;
        const pvp    = parseFloat(pvps[r.id]) || 0;
        const costs  = costoReceta(r, insumos);
        const contribU = pvp - costs.costoPorcion;
        contribucionTotal += ud * contribU;
        ingresoDia += ud * pvp;
      });
      const bepDia = contribucionTotal > 0 ? fijos / (contribucionTotal / diasMes * diasMes) * (1/diasMes) : null;

      container.innerHTML = `
        <div class="page">
          <div class="page-header">
            <div>
              <div class="page-title">Proyecciones</div>
              <div class="page-sub">Simulá cuánto vas a ganar según tus ventas diarias</div>
            </div>
          </div>

          <!-- Config de ventas por producto -->
          <div class="card" style="margin-bottom:20px;">
            <p class="section-title">Ventas estimadas por día</p>
            <p style="font-size:12px;color:var(--muted);margin-bottom:16px;">
              Ingresá cuántas unidades de cada producto esperás vender en un día normal. También asegurate de tener el PVP configurado en la sección Análisis.
            </p>
            <div style="display:flex;flex-direction:column;gap:12px;">
              ${recetas.map(r => {
                const pvp    = parseFloat(pvps[r.id]) || 0;
                const ud     = parseFloat(unidades[r.id]) || 0;
                const costs  = costoReceta(r, insumos);
                const ingDia = ud * pvp;
                const utilDia= ud * (pvp - costs.costoPorcion);
                return `
                  <div style="display:grid;grid-template-columns:1fr 100px 1fr;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
                    <div>
                      <div style="font-size:13.5px;font-weight:600;color:var(--text);">${r.nombre}</div>
                      <div style="font-size:11px;color:var(--muted);">
                        PVP: ${pvp > 0 ? fmt$(pvp) : '⚠️ sin precio'} ·
                        Costo: ${fmt$(costs.costoPorcion)} ·
                        Contribución: ${pvp > 0 ? fmt$(pvp - costs.costoPorcion) : '—'}/und
                      </div>
                    </div>
                    <div>
                      <div class="input-group">
                        <input type="number" class="ud-input" data-id="${r.id}" min="0" step="1"
                          value="${ud || ''}" placeholder="0" style="text-align:center;">
                        <span class="input-addon" style="font-size:11px;">und/día</span>
                      </div>
                    </div>
                    <div style="text-align:right;">
                      ${ud > 0 && pvp > 0 ? `
                        <div style="font-size:13px;font-weight:700;color:var(--income);">${fmt$(ingDia)}/día ingreso</div>
                        <div style="font-size:11px;color:var(--muted);">${fmt$(utilDia)}/día contribución</div>
                      ` : `<div style="font-size:12px;color:var(--muted);">Ingresá unidades y precio</div>`}
                    </div>
                  </div>`;
              }).join('')}
            </div>
          </div>

          <!-- Resumen diario -->
          ${ingresoDia > 0 ? `
            <div class="metric-grid" style="margin-bottom:20px;">
              <div class="metric-card">
                <div class="metric-label">Ingreso por día (realista)</div>
                <div class="metric-val orange">${fmt$(ingresoDia)}</div>
                <div class="metric-sub">Con las unidades configuradas</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Costo diario fijo</div>
                <div class="metric-val red">${fmt$(fijos / diasMes)}</div>
                <div class="metric-sub">Gastos fijos ÷ ${diasMes} días</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Contribución/día</div>
                <div class="metric-val ${contribucionTotal > fijos/diasMes ? 'green' : 'red'}">${fmt$(contribucionTotal)}</div>
                <div class="metric-sub">${contribucionTotal > fijos/diasMes ? '✓ Cubre los fijos' : '✗ Insuficiente'}</div>
              </div>
            </div>
          ` : ''}

          <!-- Escenarios mensuales -->
          <p class="section-title" style="margin-bottom:12px;">Proyección mensual — 3 escenarios</p>
          <div class="scenario-grid" style="margin-bottom:20px;">
            ${[
              { label: 'Pesimista', sub: '60% del volumen', data: pPesimista, cls: 'red' },
              { label: 'Realista',  sub: '100% del volumen', data: pRealista,  cls: pRealista.utilidad>=0?'green':'red' },
              { label: 'Optimista', sub: '150% del volumen', data: pOptimista, cls: 'green' },
            ].map(s => `
              <div class="scenario-card">
                <div class="scenario-label">${s.label}</div>
                <div style="font-size:11px;color:var(--muted);margin-bottom:12px;">${s.sub}</div>
                <div class="scenario-val ${s.cls}" style="color:${s.cls==='green'?'var(--income)':s.cls==='red'?'var(--danger)':'var(--warning)'};">
                  ${fmt$(s.data.utilidad)}
                </div>
                <div class="scenario-sub">ganancia neta/mes</div>
                <hr class="divider" style="margin:10px 0;">
                <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">
                  <span style="color:var(--muted);">Ingresos</span>
                  <span style="color:var(--income);font-weight:600;">${fmt$(s.data.ingresos)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">
                  <span style="color:var(--muted);">Costos variables</span>
                  <span style="color:var(--danger);">−${fmt$(s.data.costosVar)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px;">
                  <span style="color:var(--muted);">Costos fijos</span>
                  <span style="color:var(--danger);">−${fmt$(s.data.fijos)}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Break-even -->
          ${fijos > 0 && contribucionTotal > 0 ? `
            <div class="card" style="background:var(--surface2);">
              <p class="section-title">Punto de equilibrio (break-even)</p>
              <p style="font-size:13px;color:var(--text2);line-height:1.7;margin-bottom:12px;">
                Con el mix de productos actual, necesitás vender exactamente
                <strong style="color:var(--warning);">${Math.ceil(bepDia || 0)} unidades por día</strong>
                solo para cubrir costos. Cualquier venta por encima de eso es ganancia.
              </p>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                <div>
                  <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">BEP diario (unidades)</div>
                  <div style="font-size:28px;font-weight:800;color:var(--warning);">${Math.ceil(bepDia || 0)}</div>
                </div>
                <div>
                  <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">BEP mensual (unidades)</div>
                  <div style="font-size:28px;font-weight:800;color:var(--warning);">${Math.ceil((bepDia || 0) * diasMes)}</div>
                </div>
              </div>
              <div class="progress" style="margin-top:16px;">
                <div class="progress-fill ${
                  contribucionTotal >= fijos/diasMes*1.3 ? 'green' :
                  contribucionTotal >= fijos/diasMes     ? 'yellow' : 'red'
                }" style="width:${Math.min((contribucionTotal / (fijos/diasMes)) * 100, 100)}%"></div>
              </div>
              <p style="font-size:11px;color:var(--muted);margin-top:6px;">
                Cobertura actual: ${fmtPct((contribucionTotal / (fijos/diasMes)) * 100)} de los costos fijos diarios
              </p>
            </div>
          ` : `
            <div class="card" style="background:var(--surface2);">
              <p style="font-size:13px;color:var(--muted);">
                Configurá las unidades por día y los precios en la sección Análisis para ver el punto de equilibrio.
              </p>
            </div>
          `}

          <!-- Impacto de subir precio $0.25 -->
          ${pRealista.ingresos > 0 ? `
            <div class="card" style="margin-top:16px;">
              <p class="section-title">¿Qué pasa si subís cada precio en $0.25?</p>
              ${(() => {
                let extraMes = 0;
                recetas.forEach(r => {
                  const ud = parseFloat(unidades[r.id]) || 0;
                  extraMes += ud * 0.25 * diasMes;
                });
                return `
                  <p style="font-size:13px;color:var(--text2);">
                    Subirías la ganancia mensual en
                    <strong style="color:var(--income);font-size:16px;"> +${fmt$(extraMes)}</strong>
                    con el mismo volumen de ventas. Ese es el poder del precio.
                  </p>`;
              })()}
            </div>
          ` : ''}
        </div>`;

      // Inputs de unidades
      container.querySelectorAll('.ud-input').forEach(inp => {
        inp.addEventListener('input', () => {
          const cfg = Store.getConfig();
          cfg.unidades_dia = cfg.unidades_dia || {};
          cfg.unidades_dia[inp.dataset.id] = parseFloat(inp.value) || 0;
          Store.saveConfig(cfg);
          render();
        });
      });
    }

    render();
  };
})();
