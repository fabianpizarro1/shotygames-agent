/* CandyShots — Página: Insumos */
window.CS = window.CS || {};

(function () {
  'use strict';
  const { Store, Utils } = window.CS;
  const { fmt$, fmtPct, uid, costoPorUnidad } = Utils;

  const UNIDADES = [
    { val: 'g',    label: 'Gramos (g)' },
    { val: 'ml',   label: 'Mililitros (ml)' },
    { val: 'und',  label: 'Unidades (und)' },
    { val: 'kg',   label: 'Kilogramos (kg) → se convierte a g' },
    { val: 'L',    label: 'Litros (L) → se convierte a ml' },
  ];

  const CATEGORIAS = ['Lácteos', 'Jarabes/Saborizantes', 'Bases', 'Toppings', 'Empaque', 'Alcohol', 'Condimentos', 'Otro'];

  function unitLabel(u) {
    const m = { g:'g', ml:'ml', und:'und', kg:'g', L:'ml' };
    return m[u] || u;
  }

  function openForm(existing, onSave) {
    const isEdit = !!existing;
    const v = (f) => existing?.[f] ?? '';

    const unitOpts = UNIDADES.map(u => `<option value="${u.val}" ${v('unidad')===u.val?'selected':''}>${u.label}</option>`).join('');
    const catOpts  = CATEGORIAS.map(c => `<option value="${c}" ${v('categoria')===c?'selected':''}>${c}</option>`).join('');

    const html = `
      <div class="modal">
        <span class="modal-handle"></span>
        <div class="modal-header">
          <span class="modal-title">${isEdit ? 'Editar insumo' : 'Nuevo insumo'}</span>
          <button class="btn-icon modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label class="form-label">Nombre del insumo *</label>
            <input id="f-nombre" value="${v('nombre')}" placeholder="Ej: Nutella, Leche entera, Galletas Oreo">
          </div>
          <div class="form-row">
            <label class="form-label">Categoría</label>
            <select id="f-cat">${catOpts}</select>
          </div>
          <div class="form-grid-2">
            <div class="form-row">
              <label class="form-label">Unidad de compra *</label>
              <select id="f-unidad">${unitOpts}</select>
              <span class="form-hint">¿En qué unidad viene el producto?</span>
            </div>
            <div class="form-row">
              <label class="form-label">Cantidad por paquete *</label>
              <input id="f-cant" type="number" min="0.01" step="any" value="${v('cantidad_paquete')}" placeholder="400">
              <span class="form-hint" id="hint-cant">Ej: 400 para un tarro de 400g</span>
            </div>
          </div>
          <div class="form-row">
            <label class="form-label">Precio del paquete ($) *</label>
            <div class="input-group">
              <input id="f-precio" type="number" min="0.01" step="0.01" value="${v('precio_paquete')}" placeholder="3.50">
              <span class="input-addon">USD</span>
            </div>
          </div>
          <div id="preview-cost" style="margin-top:4px; font-size:12px; color:var(--muted);"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost modal-close">Cancelar</button>
          <button class="btn btn-primary" id="btn-save">
            ${isEdit ? 'Guardar cambios' : '+ Agregar insumo'}
          </button>
        </div>
      </div>`;

    const { overlay, close } = Utils.openModal(html);

    // Live preview del costo por unidad
    function updatePreview() {
      const cant  = parseFloat(overlay.querySelector('#f-cant')?.value)   || 0;
      const precio= parseFloat(overlay.querySelector('#f-precio')?.value) || 0;
      const unidad= overlay.querySelector('#f-unidad')?.value || 'g';
      const preview= overlay.querySelector('#preview-cost');
      if (cant > 0 && precio > 0) {
        const cpu = precio / cant;
        const ul  = unitLabel(unidad);
        preview.textContent = `→ Costo por ${ul}: ${fmt$(cpu, 4)}`;
      } else {
        preview.textContent = '';
      }
    }
    overlay.querySelector('#f-cant')?.addEventListener('input', updatePreview);
    overlay.querySelector('#f-precio')?.addEventListener('input', updatePreview);
    updatePreview();

    overlay.querySelector('#btn-save').addEventListener('click', () => {
      const nombre = overlay.querySelector('#f-nombre').value.trim();
      const cant   = parseFloat(overlay.querySelector('#f-cant').value);
      const precio = parseFloat(overlay.querySelector('#f-precio').value);
      if (!nombre) return alert('Ingresa el nombre del insumo');
      if (!cant || cant <= 0) return alert('Ingresa una cantidad válida');
      if (!precio || precio <= 0) return alert('Ingresa un precio válido');

      const insumo = {
        id:               isEdit ? existing.id : uid(),
        nombre,
        categoria:        overlay.querySelector('#f-cat').value,
        unidad:           overlay.querySelector('#f-unidad').value,
        cantidad_paquete: cant,
        precio_paquete:   precio,
      };
      if (isEdit) Store.updateInsumo(insumo); else Store.addInsumo(insumo);
      close();
      onSave();
    });
  }

  window.CS.renderInsumos = function (container) {
    function render() {
      const insumos = Store.getInsumos();
      container.innerHTML = `
        <div class="page">
          <div class="page-header">
            <div>
              <div class="page-title">Insumos</div>
              <div class="page-sub">${insumos.length} ingrediente${insumos.length !== 1 ? 's' : ''} registrado${insumos.length !== 1 ? 's' : ''}</div>
            </div>
            <button class="btn btn-primary" id="btn-new">+ Nuevo insumo</button>
          </div>

          <div class="card" style="margin-bottom:16px; background:var(--surface2); border-color:var(--accent-dim);">
            <p style="font-size:12.5px; color:var(--text2); line-height:1.6;">
              <strong style="color:var(--accent)">¿Qué es un insumo?</strong><br>
              Cada ingrediente o material que comprás para hacer tus productos.
              Registrá el precio y la cantidad del paquete tal como lo comprás — el sistema calcula el costo por gramo/ml/unidad automáticamente.
            </p>
          </div>

          ${insumos.length === 0 ? `
            <div class="empty">
              <div class="empty-icon">🛒</div>
              <div class="empty-title">Sin insumos todavía</div>
              <div class="empty-sub">Empezá agregando tus ingredientes — Nutella, leche, galletas Oreo, jarabe de coco, etc.</div>
            </div>
          ` : `
            <div class="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th>Categoría</th>
                    <th>Paquete</th>
                    <th class="right">Precio paquete</th>
                    <th class="right">Costo por unidad</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${insumos.map(ins => {
                    const cpu = costoPorUnidad(ins);
                    const ul  = unitLabel(ins.unidad);
                    return `<tr data-id="${ins.id}">
                      <td class="primary">${ins.nombre}</td>
                      <td><span class="badge badge-orange">${ins.categoria || 'Otro'}</span></td>
                      <td class="text-muted">${ins.cantidad_paquete} ${ins.unidad}</td>
                      <td class="right text-income">${fmt$(ins.precio_paquete)}</td>
                      <td class="right" style="font-size:12px; color:var(--text2);">
                        ${fmt$(cpu, 4)} / ${ul}
                      </td>
                      <td>
                        <div style="display:flex;gap:6px;justify-content:flex-end;">
                          <button class="btn-icon btn-edit" data-id="${ins.id}" title="Editar">✎</button>
                          <button class="btn-icon danger btn-del" data-id="${ins.id}" title="Eliminar">✕</button>
                        </div>
                      </td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>`;

      container.querySelector('#btn-new').addEventListener('click', () => openForm(null, render));

      container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const ins = Store.getInsumos().find(i => i.id === btn.dataset.id);
          if (ins) openForm(ins, render);
        });
      });
      container.querySelectorAll('.btn-del').forEach(btn => {
        btn.addEventListener('click', () => {
          // Verificar si se usa en alguna receta
          const recetas = Store.getRecetas();
          const usadoEn = recetas.filter(r => r.ingredientes?.some(i => i.insumo_id === btn.dataset.id));
          if (usadoEn.length > 0) {
            return alert(`No se puede eliminar — este insumo se usa en: ${usadoEn.map(r=>r.nombre).join(', ')}`);
          }
          if (confirm('¿Eliminar este insumo?')) {
            Store.deleteInsumo(btn.dataset.id);
            render();
          }
        });
      });
    }
    render();
  };
})();
