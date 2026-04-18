const Ingredientes = (() => {
  let filtro = '';

  function init() {
    document.getElementById('search-ing').addEventListener('input', Utils.debounce((e) => {
      filtro = e.target.value.toLowerCase();
      render();
    }, 200));
  }

  function render() {
    const list = document.getElementById('list-ing');
    if (!list) return;
    const data = DB.all('ingredientes')
      .filter(i => !filtro || i.nombre.toLowerCase().includes(filtro))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    if (!data.length) {
      list.innerHTML = `<div class="empty">
        <span class="empty-ico">🥕</span>
        <p>Aún no cargaste ingredientes.</p>
        <button class="btn btn-primary" id="empty-new-ing">Agregar primer ingrediente</button>
      </div>`;
      document.getElementById('empty-new-ing').onclick = () => abrirForm();
      return;
    }

    list.innerHTML = data.map(i => {
      const cu = Utils.costoUnitarioIng(i);
      return `<div class="item" data-edit="${i.id}">
        <div class="item-body">
          <div class="item-title">${Utils.esc(i.nombre)}</div>
          <div class="item-sub">${Utils.fmtMoney(i.precio)} / ${i.cantidad} ${i.unidad}</div>
        </div>
        <div class="item-right">
          <span class="item-price">${Utils.fmtMoney(cu)}</span>
          <span class="muted small">por ${i.unidad}</span>
        </div>
      </div>`;
    }).join('');

    list.querySelectorAll('[data-edit]').forEach(el => el.onclick = () => abrirForm(el.dataset.edit));
  }

  function abrirForm(id) {
    const ing = id ? DB.get('ingredientes', id) : { nombre: '', unidad: 'g', cantidad: 1000, precio: 0 };
    Utils.modal.open({
      titulo: id ? 'Editar ingrediente' : 'Nuevo ingrediente',
      html: `
        <label class="field">
          <span>Nombre</span>
          <input id="f-nombre" class="input" value="${Utils.esc(ing.nombre)}" placeholder="Ej: Harina 000" />
        </label>
        <label class="field">
          <span>Unidad de medida</span>
          <select id="f-unidad" class="input">
            ${['g','kg','ml','l','unidad'].map(u => `<option ${ing.unidad===u?'selected':''}>${u}</option>`).join('')}
          </select>
        </label>
        <label class="field">
          <span>Cantidad que compraste</span>
          <input type="number" step="any" min="0" inputmode="decimal" id="f-cantidad" class="input" value="${ing.cantidad||0}" />
        </label>
        <label class="field">
          <span>Precio total pagado</span>
          <input type="number" step="any" min="0" inputmode="decimal" id="f-precio" class="input" value="${ing.precio||0}" />
        </label>
        <p class="muted small">Ejemplo: 1000 g por $2.500 → costo $2.50/g</p>
        ${id ? `<button type="button" class="btn btn-danger btn-block mt-3" id="f-del">Eliminar</button>` : ''}
      `,
      botones: [
        { text: 'Cancelar' },
        { text: 'Guardar', cls: 'btn-primary', onClick: async () => {
          const nuevo = {
            ...(id ? ing : {}),
            id: ing.id,
            nombre: document.getElementById('f-nombre').value.trim(),
            unidad: document.getElementById('f-unidad').value,
            cantidad: Utils.parseNum(document.getElementById('f-cantidad').value),
            precio: Utils.parseNum(document.getElementById('f-precio').value)
          };
          if (!nuevo.nombre) { Utils.toast('Falta el nombre', 'warn'); return false; }
          if (nuevo.cantidad <= 0 || nuevo.precio < 0) { Utils.toast('Valores inválidos', 'warn'); return false; }
          await DB.save('ingredientes', nuevo);
          Utils.toast('Guardado', 'success');
        }}
      ]
    });

    if (id) {
      document.getElementById('f-del').onclick = async () => {
        if (await Utils.confirmar(`¿Eliminar "${ing.nombre}"?`)) {
          await DB.remove('ingredientes', id);
          Utils.modal.close();
          Utils.toast('Eliminado', 'info');
        }
      };
    }
  }

  return { init, render, abrirForm };
})();
