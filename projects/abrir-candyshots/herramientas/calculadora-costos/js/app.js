/* CandyShots — App Router */
(function () {
  'use strict';

  const PAGES = {
    insumos:      { fn: window.CS.renderInsumos,      title: 'Insumos' },
    recetas:      { fn: window.CS.renderRecetas,      title: 'Recetas' },
    costos:       { fn: window.CS.renderCostos,       title: 'Costos Fijos' },
    analisis:     { fn: window.CS.renderAnalisis,     title: 'Análisis por Producto' },
    proyecciones: { fn: window.CS.renderProyecciones, title: 'Proyecciones' },
  };

  // Cargar seed de insumos reales si es la primera vez
  window.CS.Store.init();

  const content = document.getElementById('content');
  const topbar  = document.getElementById('topbar-title');

  function navigate(page) {
    if (!PAGES[page]) return;

    // Update nav
    document.querySelectorAll('[data-page]').forEach(el =>
      el.classList.toggle('active', el.dataset.page === page)
    );

    // Render
    topbar.textContent = PAGES[page].title;
    content.innerHTML  = '';
    content.scrollTop  = 0;
    PAGES[page].fn(content);

    // Save
    try { sessionStorage.setItem('cs_page', page); } catch {}
  }

  // Nav events
  document.querySelectorAll('[data-page]').forEach(el =>
    el.addEventListener('click', () => navigate(el.dataset.page))
  );

  // Restore last page or start with insumos
  const last = (() => { try { return sessionStorage.getItem('cs_page'); } catch { return null; } })();
  navigate(PAGES[last] ? last : 'insumos');
})();
