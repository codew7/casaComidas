const Ingredientes = (() => {
  let filtro = '';

  function init() {
    document.getElementById('btn-new-ing').onclick = () => abrirForm();
    document.getElementById('search-ing').addEventListener('input', Utils.debounce((e) => {
      filtro = e.target.value.toLowerCase();
      render();
    }, 200));
  }

  function render() {
    const tbody = document.getElementById('tbl-ing');
    if (!tbody) return;
    const data = DB.all('ingredientes')
      .filter(i => !filtro || i.nombre.toLowerCase().includes(filtro))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="center muted">Sin ingredientes. Creá el primero.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(i => {
      const cu = Utils.costoUnitarioIng(i);
      return `<tr>
        <td><strong>${escapeHtml(i.nombre)}</strong></td>
        <td>${i.unidad}</td>
        <td>${i.cantidad}</td>
        <td>${Utils.fmtMoney(i.precio)}</td>
        <td>${i.merma || 0}%</td>
        <td><strong>${Utils.fmtMoney(cu)}</strong> / ${i.unidad}</td>
        <td class="actions">
          <button class="btn btn-ghost btn-sm" data-edit="${i.id}">Editar</button>
          <button class="btn btn-danger btn-sm" data-del="${i.id}">×</button>
        </td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => abrirForm(b.dataset.edit));
    tbody.querySelectorAll('[data-del]').forEach(b => b.onclick = () => borrar(b.dataset.del));
  }

  function abrirForm(id) {
    const ing = id ? DB.get('ingredientes', id) : { nombre: '', unidad: 'g', cantidad: 1000, precio: 0, merma: 0 };
    Utils.modal.open({
      titulo: id ? 'Editar ingrediente' : 'Nuevo ingrediente',
      html: `
        <label>Nombre<input id="f-nombre" value="${escapeAttr(ing.nombre)}" required /></label>
        <div class="grid-2">
          <label>Unidad
            <select id="f-unidad">
              ${['g','kg','ml','l','unidad'].map(u => `<option ${ing.unidad===u?'selected':''}>${u}</option>`).join('')}
            </select>
          </label>
          <label>Cantidad base<input type="number" step="any" min="0" id="f-cantidad" value="${ing.cantidad||0}" /></label>
        </div>
        <div class="grid-2">
          <label>Precio compra<input type="number" step="any" min="0" id="f-precio" value="${ing.precio||0}" /></label>
          <label>Merma %<input type="number" step="any" min="0" max="100" id="f-merma" value="${ing.merma||0}" /></label>
        </div>
        <p class="muted small">Costo unitario = precio / (cantidad × (1 - merma%))</p>
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
            precio: Utils.parseNum(document.getElementById('f-precio').value),
            merma: Utils.parseNum(document.getElementById('f-merma').value)
          };
          if (!nuevo.nombre) { Utils.toast('Nombre requerido', 'warn'); return false; }
          if (nuevo.cantidad <= 0 || nuevo.precio < 0) { Utils.toast('Valores inválidos', 'warn'); return false; }
          await DB.save('ingredientes', nuevo);
          Utils.toast('Ingrediente guardado', 'success');
        }}
      ]
    });
  }

  async function borrar(id) {
    const ing = DB.get('ingredientes', id);
    if (!ing) return;
    if (!await Utils.confirmar(`¿Eliminar "${ing.nombre}"?`)) return;
    await DB.remove('ingredientes', id);
    Utils.toast('Ingrediente eliminado', 'info');
  }

  function escapeHtml(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escapeAttr(s='') { return escapeHtml(s); }

  return { init, render };
})();
