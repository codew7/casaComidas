const Costos = (() => {
  function init() {}

  function render() {
    const list = document.getElementById('list-costos');
    if (!list) return;
    const data = DB.all('costos').sort((a,b) => a.nombre.localeCompare(b.nombre));

    if (!data.length) {
      list.innerHTML = `<div class="empty">
        <span class="empty-ico">💰</span>
        <p>Sin costos adicionales aún.</p>
        <button class="btn btn-primary" id="empty-new-costo">Agregar costo</button>
      </div>`;
      document.getElementById('empty-new-costo').onclick = () => abrirForm();
      return;
    }

    list.innerHTML = data.map(c => `<div class="item" data-edit="${c.id}">
      <div class="item-body">
        <div class="item-title">${Utils.esc(c.nombre)}</div>
        <div class="item-sub">${c.prorratear ? 'Por porción' : 'Fijo por receta'}</div>
      </div>
      <div class="item-right">
        <span class="item-price">${Utils.fmtMoney(c.monto)}</span>
      </div>
    </div>`).join('');

    list.querySelectorAll('[data-edit]').forEach(el => el.onclick = () => abrirForm(el.dataset.edit));
  }

  function abrirForm(id) {
    const c = id ? DB.get('costos', id) : { nombre: '', monto: 0, prorratear: true };
    Utils.modal.open({
      titulo: id ? 'Editar costo' : 'Nuevo costo',
      html: `
        <label class="field">
          <span>Nombre</span>
          <input id="f-nombre" class="input" value="${Utils.esc(c.nombre)}" placeholder="Ej: Envase, bandeja, servilleta" />
        </label>
        <label class="field">
          <span>Monto</span>
          <input type="number" step="any" min="0" inputmode="decimal" id="f-monto" class="input" value="${c.monto||0}" />
        </label>
        <label class="field">
          <span>¿Cómo se aplica?</span>
          <select id="f-prorr" class="input">
            <option value="1" ${c.prorratear?'selected':''}>Por cada porción (ej: envase individual)</option>
            <option value="0" ${!c.prorratear?'selected':''}>Una vez por receta completa</option>
          </select>
        </label>
        ${id ? `<button type="button" class="btn btn-danger btn-block mt-3" id="f-del">Eliminar</button>` : ''}
      `,
      botones: [
        { text: 'Cancelar' },
        { text: 'Guardar', cls: 'btn-primary', onClick: async () => {
          const nuevo = {
            ...(id ? c : {}),
            id: c.id,
            nombre: document.getElementById('f-nombre').value.trim(),
            monto: Utils.parseNum(document.getElementById('f-monto').value),
            prorratear: document.getElementById('f-prorr').value === '1'
          };
          if (!nuevo.nombre) { Utils.toast('Falta el nombre', 'warn'); return false; }
          await DB.save('costos', nuevo);
          Utils.toast('Guardado', 'success');
        }}
      ]
    });

    if (id) {
      document.getElementById('f-del').onclick = async () => {
        if (await Utils.confirmar(`¿Eliminar "${c.nombre}"?`)) {
          await DB.remove('costos', id);
          Utils.modal.close();
          Utils.toast('Eliminado', 'info');
        }
      };
    }
  }

  function totalAplicable(porciones = 1) {
    return DB.all('costos').reduce((s, c) => {
      const monto = Utils.parseNum(c.monto);
      return s + (c.prorratear ? monto * porciones : monto);
    }, 0);
  }

  return { init, render, abrirForm, totalAplicable };
})();
