const Dashboard = (() => {
  let filtro = '';

  function init() {
    document.getElementById('search-productos').addEventListener('input', Utils.debounce(e => {
      filtro = e.target.value.toLowerCase();
      renderLista();
    }, 200));
  }

  function render() {
    const u = App.state.user;
    const saludo = document.getElementById('hello-user');
    if (saludo) saludo.textContent = u && !u.isAnonymous && u.email ? `Hola, ${u.email.split('@')[0]}` : 'Hola';

    document.getElementById('stat-ing').textContent = DB.all('ingredientes').length;
    document.getElementById('stat-rec').textContent = DB.all('recetas').length;
    const prods = DB.all('productos');
    document.getElementById('stat-prod').textContent = prods.length;

    if (prods.length) {
      const avg = prods.reduce((s, p) => s + (p.margen || 0), 0) / prods.length;
      document.getElementById('stat-margen').textContent = Utils.fmtPct(avg);
    } else {
      document.getElementById('stat-margen').textContent = '—';
    }

    renderLista();
  }

  function renderLista() {
    const list = document.getElementById('list-productos');
    const data = DB.all('productos')
      .filter(p => !filtro || (p.nombre||'').toLowerCase().includes(filtro))
      .sort((a,b) => (b.margen||0) - (a.margen||0));

    if (!data.length) {
      list.innerHTML = `<div class="empty">
        <span class="empty-ico">📦</span>
        <p>Todavía no guardaste productos.</p>
        <p class="small muted">Usá la Calculadora para definir precios.</p>
      </div>`;
      return;
    }

    list.innerHTML = data.map(p => {
      const cls = Utils.colorMargen(p.margen || 0);
      return `<div class="item" data-id="${p.id}">
        <div class="item-body">
          <div class="item-title">${Utils.esc(p.nombre)}</div>
          <div class="item-sub">
            Costo ${Utils.fmtMoney(p.costoPorcion)}
            <span class="${cls}">${Utils.fmtPct(p.margen)}</span>
          </div>
        </div>
        <div class="item-right">
          <span class="item-price">${Utils.fmtMoney(p.precio)}</span>
          <span class="muted small">precio</span>
        </div>
      </div>`;
    }).join('');

    list.querySelectorAll('[data-id]').forEach(el => el.onclick = () => abrirDetalle(el.dataset.id));
  }

  function abrirDetalle(id) {
    const p = DB.get('productos', id);
    if (!p) return;
    Utils.modal.open({
      titulo: p.nombre,
      html: `
        <div class="result-row"><span class="muted">Porciones</span><span>${p.porciones||1}</span></div>
        <div class="result-row"><span class="muted">Costo total</span><span>${Utils.fmtMoney(p.costoTotal)}</span></div>
        <div class="result-row"><span class="muted">Costo por porción</span><span>${Utils.fmtMoney(p.costoPorcion)}</span></div>
        <div class="divider"></div>
        <div class="result-big"><span>Precio</span><strong>${Utils.fmtMoney(p.precio)}</strong></div>
        <div class="result-row"><span class="muted">Margen</span><span>${Utils.fmtPct(p.margen)}</span></div>
        <button class="btn btn-danger btn-block mt-3" id="del-prod">Eliminar producto</button>
      `,
      botones: [{ text: 'Cerrar' }]
    });
    document.getElementById('del-prod').onclick = async () => {
      if (await Utils.confirmar(`¿Eliminar "${p.nombre}"?`)) {
        await DB.remove('productos', id);
        Utils.modal.close();
        Utils.toast('Eliminado', 'info');
      }
    };
  }

  return { init, render };
})();
