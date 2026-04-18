const Recetas = (() => {
  let filtro = '';

  function init() {
    document.getElementById('search-rec').addEventListener('input', Utils.debounce(e => {
      filtro = e.target.value.toLowerCase();
      render();
    }, 200));
  }

  function costoReceta(rec) {
    const items = rec.items || [];
    return items.reduce((s, it) => {
      const ing = DB.get('ingredientes', it.ingId);
      if (!ing) return s;
      const cu = Utils.costoUnitarioIng(ing);
      return s + cu * Utils.parseNum(it.cantidad);
    }, 0);
  }

  function render() {
    const list = document.getElementById('list-rec');
    if (!list) return;
    const data = DB.all('recetas')
      .filter(r => !filtro || r.nombre.toLowerCase().includes(filtro))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    if (!data.length) {
      list.innerHTML = `<div class="empty">
        <span class="empty-ico">📖</span>
        <p>Todavía no creaste recetas.</p>
        <button class="btn btn-primary" id="empty-new-rec">Crear primera receta</button>
      </div>`;
      document.getElementById('empty-new-rec').onclick = () => abrirForm();
      return;
    }

    list.innerHTML = data.map(r => {
      const n = (r.items || []).length;
      return `<div class="item" data-edit="${r.id}">
        <div class="item-body">
          <div class="item-title">${Utils.esc(r.nombre)}</div>
          <div class="item-sub">${n} ${n === 1 ? 'ingrediente' : 'ingredientes'}</div>
        </div>
        <div class="item-right">
          <span class="item-price">${Utils.fmtMoney(costoReceta(r))}</span>
          <span class="muted small">costo total</span>
        </div>
      </div>`;
    }).join('');

    list.querySelectorAll('[data-edit]').forEach(el => el.onclick = () => abrirForm(el.dataset.edit));
  }

  function renderFilas(items) {
    const ings = DB.all('ingredientes').sort((a,b) => a.nombre.localeCompare(b.nombre));
    const opciones = ings.map(i => ({
      id: i.id,
      label: `${i.nombre} (${i.unidad})`,
      cu: Utils.costoUnitarioIng(i),
      unidad: i.unidad
    }));

    return items.map((it, idx) => {
      const opt = opciones.find(o => o.id === it.ingId);
      const cu = opt ? opt.cu : 0;
      const parcial = cu * Utils.parseNum(it.cantidad);
      return `<div class="receta-row" data-idx="${idx}">
        <button type="button" class="icon-btn fr-del" aria-label="Eliminar">✕</button>
        <select class="input fr-ing">
          <option value="">Elegir ingrediente...</option>
          ${opciones.map(o => `<option value="${o.id}" ${o.id===it.ingId?'selected':''}>${Utils.esc(o.label)}</option>`).join('')}
        </select>
        <input class="input fr-cant" type="number" step="any" min="0" inputmode="decimal" placeholder="Cantidad (${opt?.unidad||'g/ml/un'})" value="${it.cantidad||''}" />
        <div class="fr-info">${opt ? `${Utils.fmtMoney(cu)}/${opt.unidad} · Subtotal: <strong>${Utils.fmtMoney(parcial)}</strong>` : '&nbsp;'}</div>
      </div>`;
    }).join('');
  }

  function abrirForm(id) {
    const hayIng = DB.all('ingredientes').length > 0;
    if (!hayIng) {
      Utils.toast('Primero cargá al menos un ingrediente', 'warn');
      return;
    }

    const rec = id ? JSON.parse(JSON.stringify(DB.get('recetas', id))) : { nombre: '', descripcion: '', items: [] };
    Utils.modal.open({
      titulo: id ? 'Editar receta' : 'Nueva receta',
      html: `
        <label class="field">
          <span>Nombre</span>
          <input id="f-nombre" class="input" value="${Utils.esc(rec.nombre)}" placeholder="Ej: Empanadas de carne" />
        </label>
        <label class="field">
          <span>Descripción <span class="muted">(opcional)</span></span>
          <input id="f-desc" class="input" value="${Utils.esc(rec.descripcion||'')}" />
        </label>

        <div class="field">
          <span>Ingredientes</span>
          <div id="receta-items" class="receta-rows"></div>
          <button type="button" class="btn btn-ghost mt-2" id="btn-add-row">+ Agregar ingrediente</button>
        </div>

        <div class="card card-soft" style="margin-top:var(--space-3);">
          <div class="result-big">
            <span>Costo total</span>
            <strong id="f-total">$0</strong>
          </div>
        </div>

        ${id ? `<button type="button" class="btn btn-danger btn-block mt-3" id="f-del">Eliminar receta</button>` : ''}
      `,
      botones: [
        { text: 'Cancelar' },
        { text: 'Guardar', cls: 'btn-primary', onClick: async () => {
          rec.nombre = document.getElementById('f-nombre').value.trim();
          rec.descripcion = document.getElementById('f-desc').value.trim();
          rec.items = leerFilas();
          if (!rec.nombre) { Utils.toast('Falta el nombre', 'warn'); return false; }
          await DB.save('recetas', rec);
          Utils.toast('Receta guardada', 'success');
        }}
      ]
    });

    function leerTodasFilas() {
      return [...document.querySelectorAll('#receta-items .receta-row')].map(row => ({
        ingId: row.querySelector('.fr-ing').value,
        cantidad: Utils.parseNum(row.querySelector('.fr-cant').value)
      }));
    }
    function leerFilas() {
      return leerTodasFilas().filter(x => x.ingId && x.cantidad > 0);
    }

    function actualizarTotal() {
      document.getElementById('f-total').textContent = Utils.fmtMoney(costoReceta({ items: leerFilas() }));
    }

    function recalcular() {
      const todas = leerTodasFilas();
      document.getElementById('receta-items').innerHTML = renderFilas(todas.length ? todas : [{ ingId: '', cantidad: 0 }]);
      actualizarTotal();
      bind();
    }

    function bind() {
      document.querySelectorAll('#receta-items .receta-row').forEach(row => {
        row.querySelector('.fr-ing').onchange = recalcular;
        row.querySelector('.fr-cant').oninput = Utils.debounce(recalcular, 300);
        row.querySelector('.fr-del').onclick = () => {
          const todas = leerTodasFilas();
          todas.splice(+row.dataset.idx, 1);
          document.getElementById('receta-items').innerHTML = renderFilas(todas.length ? todas : [{ ingId: '', cantidad: 0 }]);
          actualizarTotal();
          bind();
        };
      });
    }

    document.getElementById('btn-add-row').onclick = () => {
      const todas = leerTodasFilas();
      todas.push({ ingId: '', cantidad: 0 });
      document.getElementById('receta-items').innerHTML = renderFilas(todas);
      bind();
    };

    // Inicializar filas
    const itemsInit = rec.items.length ? rec.items : [{ ingId: '', cantidad: 0 }];
    document.getElementById('receta-items').innerHTML = renderFilas(itemsInit);
    actualizarTotal();
    bind();

    if (id) {
      document.getElementById('f-del').onclick = async () => {
        if (await Utils.confirmar(`¿Eliminar "${rec.nombre}"?`)) {
          await DB.remove('recetas', id);
          Utils.modal.close();
          Utils.toast('Eliminada', 'info');
        }
      };
    }
  }

  return { init, render, abrirForm, costoReceta };
})();
