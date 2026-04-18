const Recetas = (() => {
  let filtro = '';

  function init() {
    document.getElementById('btn-new-rec').onclick = () => abrirForm();
    document.getElementById('search-rec').addEventListener('input', Utils.debounce(e => {
      filtro = e.target.value.toLowerCase();
      render();
    }, 200));
  }

  function costoReceta(rec) {
    const items = rec.items || [];
    const base = items.reduce((s, it) => {
      const ing = DB.get('ingredientes', it.ingId);
      if (!ing) return s;
      const cu = Utils.costoUnitarioIng(ing);
      return s + cu * Utils.parseNum(it.cantidad);
    }, 0);
    const merma = Utils.parseNum(rec.merma) / 100;
    return base * (1 + merma);
  }

  function render() {
    const tbody = document.getElementById('tbl-rec');
    if (!tbody) return;
    const data = DB.all('recetas')
      .filter(r => !filtro || r.nombre.toLowerCase().includes(filtro))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="center muted">Sin recetas aún.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(r => `<tr>
      <td><strong>${esc(r.nombre)}</strong><br><span class="muted small">${esc(r.descripcion||'')}</span></td>
      <td>${(r.items||[]).length}</td>
      <td>${r.merma||0}%</td>
      <td><strong>${Utils.fmtMoney(costoReceta(r))}</strong></td>
      <td class="actions">
        <button class="btn btn-ghost btn-sm" data-dup="${r.id}">Duplicar</button>
        <button class="btn btn-ghost btn-sm" data-edit="${r.id}">Editar</button>
        <button class="btn btn-danger btn-sm" data-del="${r.id}">×</button>
      </td>
    </tr>`).join('');

    tbody.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => abrirForm(b.dataset.edit));
    tbody.querySelectorAll('[data-dup]').forEach(b => b.onclick = () => duplicar(b.dataset.dup));
    tbody.querySelectorAll('[data-del]').forEach(b => b.onclick = () => borrar(b.dataset.del));
  }

  function renderFilas(items) {
    const ings = DB.all('ingredientes').sort((a,b) => a.nombre.localeCompare(b.nombre));
    const opciones = ings.map(i => ({ id: i.id, label: `${i.nombre} (${i.unidad})`, cu: Utils.costoUnitarioIng(i), unidad: i.unidad }));

    return items.map((it, idx) => {
      const opt = opciones.find(o => o.id === it.ingId);
      const cu = opt ? opt.cu : 0;
      const parcial = cu * Utils.parseNum(it.cantidad);
      return `<div class="receta-row" data-idx="${idx}">
        <select class="input fr-ing">
          <option value="">Seleccionar ingrediente...</option>
          ${opciones.map(o => `<option value="${o.id}" ${o.id===it.ingId?'selected':''}>${esc(o.label)}</option>`).join('')}
        </select>
        <input class="input fr-cant" type="number" step="any" min="0" placeholder="Cantidad" value="${it.cantidad||''}" />
        <span class="muted small">${Utils.fmtMoney(cu)}/${opt?.unidad||''} · parcial: <strong>${Utils.fmtMoney(parcial)}</strong></span>
        <button type="button" class="btn btn-danger btn-sm fr-del">×</button>
      </div>`;
    }).join('');
  }

  function abrirForm(id) {
    const rec = id ? JSON.parse(JSON.stringify(DB.get('recetas', id))) : { nombre: '', descripcion: '', merma: 0, items: [] };
    Utils.modal.open({
      titulo: id ? 'Editar receta' : 'Nueva receta',
      html: `
        <label>Nombre<input id="f-nombre" value="${escAttr(rec.nombre)}" /></label>
        <label>Descripción<input id="f-desc" value="${escAttr(rec.descripcion||'')}" /></label>
        <label>Merma de la receta %<input id="f-merma" type="number" step="any" min="0" max="100" value="${rec.merma||0}" /></label>

        <h4>Ingredientes</h4>
        <div id="receta-items" class="receta-rows">${renderFilas(rec.items)}</div>
        <button type="button" class="btn btn-ghost mt-2" id="btn-add-row">+ Agregar ingrediente</button>

        <div class="mt-4 fw-600">Costo total: <span id="f-total">${Utils.fmtMoney(costoReceta(rec))}</span></div>
      `,
      botones: [
        { text: 'Cancelar' },
        { text: 'Guardar', cls: 'btn-primary', onClick: async () => {
          rec.nombre = document.getElementById('f-nombre').value.trim();
          rec.descripcion = document.getElementById('f-desc').value.trim();
          rec.merma = Utils.parseNum(document.getElementById('f-merma').value);
          rec.items = leerFilas();
          if (!rec.nombre) { Utils.toast('Nombre requerido', 'warn'); return false; }
          await DB.save('recetas', rec);
          Utils.toast('Receta guardada', 'success');
        }}
      ]
    });

    // Lee todas las filas sin filtrar (para re-render y agregar/borrar)
    function leerTodasFilas() {
      return [...document.querySelectorAll('#receta-items .receta-row')].map(row => ({
        ingId: row.querySelector('.fr-ing').value,
        cantidad: Utils.parseNum(row.querySelector('.fr-cant').value)
      }));
    }

    // Solo filas completas, para guardar
    function leerFilas() {
      return leerTodasFilas().filter(x => x.ingId && x.cantidad > 0);
    }

    function recalcular() {
      const todasFilas = leerTodasFilas();
      rec.merma = Utils.parseNum(document.getElementById('f-merma').value);
      document.getElementById('receta-items').innerHTML = renderFilas(todasFilas.length ? todasFilas : [{ ingId: '', cantidad: 0 }]);
      document.getElementById('f-total').textContent = Utils.fmtMoney(costoReceta({ ...rec, items: leerFilas() }));
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
          document.getElementById('f-total').textContent = Utils.fmtMoney(costoReceta({ ...rec, items: leerFilas() }));
          bind();
        };
      });
      document.getElementById('f-merma').oninput = Utils.debounce(() => {
        rec.merma = Utils.parseNum(document.getElementById('f-merma').value);
        document.getElementById('f-total').textContent = Utils.fmtMoney(costoReceta({ ...rec, items: leerFilas() }));
      }, 200);
    }

    document.getElementById('btn-add-row').onclick = () => {
      const todas = leerTodasFilas();
      todas.push({ ingId: '', cantidad: 0 });
      document.getElementById('receta-items').innerHTML = renderFilas(todas);
      bind();
    };

    // Estado inicial: asegurar al menos una fila
    if (!rec.items.length) {
      rec.items = [{ ingId: '', cantidad: 0 }];
      document.getElementById('receta-items').innerHTML = renderFilas(rec.items);
    }
    bind();
  }

  async function duplicar(id) {
    const r = DB.get('recetas', id);
    if (!r) return;
    const copia = { ...JSON.parse(JSON.stringify(r)), id: null, nombre: r.nombre + ' (copia)' };
    delete copia.id;
    await DB.save('recetas', copia);
    Utils.toast('Receta duplicada', 'success');
  }

  async function borrar(id) {
    const r = DB.get('recetas', id);
    if (!r) return;
    if (!await Utils.confirmar(`¿Eliminar "${r.nombre}"?`)) return;
    await DB.remove('recetas', id);
    Utils.toast('Receta eliminada', 'info');
  }

  function esc(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escAttr(s='') { return esc(s); }

  return { init, render, costoReceta };
})();
