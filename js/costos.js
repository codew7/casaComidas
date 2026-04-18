const Costos = (() => {
  function init() {
    document.getElementById('btn-new-costo').onclick = () => abrirForm();
  }

  function render() {
    const tbody = document.getElementById('tbl-costos');
    if (!tbody) return;
    const data = DB.all('costos').sort((a,b) => a.nombre.localeCompare(b.nombre));

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="center muted">Sin costos adicionales.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(c => `<tr>
      <td><strong>${esc(c.nombre)}</strong></td>
      <td>${c.tipo}</td>
      <td>${Utils.fmtMoney(c.monto)}</td>
      <td>${c.prorratear ? 'Sí' : 'No'}</td>
      <td>${c.aplicar === 'todas' ? 'Todas' : 'Selectivo'}</td>
      <td class="actions">
        <button class="btn btn-ghost btn-sm" data-edit="${c.id}">Editar</button>
        <button class="btn btn-danger btn-sm" data-del="${c.id}">×</button>
      </td>
    </tr>`).join('');

    tbody.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => abrirForm(b.dataset.edit));
    tbody.querySelectorAll('[data-del]').forEach(b => b.onclick = () => borrar(b.dataset.del));
  }

  function abrirForm(id) {
    const c = id ? DB.get('costos', id) : { nombre: '', tipo: 'fijo', monto: 0, prorratear: false, aplicar: 'todas' };
    Utils.modal.open({
      titulo: id ? 'Editar costo' : 'Nuevo costo',
      html: `
        <label>Nombre<input id="f-nombre" value="${escAttr(c.nombre)}" /></label>
        <div class="grid-2">
          <label>Tipo
            <select id="f-tipo">
              <option value="fijo" ${c.tipo==='fijo'?'selected':''}>Fijo</option>
              <option value="variable" ${c.tipo==='variable'?'selected':''}>Variable</option>
            </select>
          </label>
          <label>Monto<input type="number" step="any" min="0" id="f-monto" value="${c.monto||0}" /></label>
        </div>
        <label><input type="checkbox" id="f-prorr" ${c.prorratear?'checked':''} /> Prorratear por cantidad de porciones</label>
        <label>Aplicar a
          <select id="f-apl">
            <option value="todas" ${c.aplicar==='todas'?'selected':''}>Todas las recetas</option>
            <option value="selectivo" ${c.aplicar==='selectivo'?'selected':''}>Selectivo (elegir en calculadora)</option>
          </select>
        </label>
      `,
      botones: [
        { text: 'Cancelar' },
        { text: 'Guardar', cls: 'btn-primary', onClick: async () => {
          const nuevo = {
            ...(id ? c : {}),
            id: c.id,
            nombre: document.getElementById('f-nombre').value.trim(),
            tipo: document.getElementById('f-tipo').value,
            monto: Utils.parseNum(document.getElementById('f-monto').value),
            prorratear: document.getElementById('f-prorr').checked,
            aplicar: document.getElementById('f-apl').value
          };
          if (!nuevo.nombre) { Utils.toast('Nombre requerido', 'warn'); return false; }
          await DB.save('costos', nuevo);
          Utils.toast('Costo guardado', 'success');
        }}
      ]
    });
  }

  async function borrar(id) {
    const c = DB.get('costos', id);
    if (!c) return;
    if (!await Utils.confirmar(`¿Eliminar "${c.nombre}"?`)) return;
    await DB.remove('costos', id);
    Utils.toast('Costo eliminado', 'info');
  }

  // Devuelve el total de costos adicionales aplicable a una receta, por porciones
  function totalAplicable(porciones = 1) {
    return DB.all('costos')
      .filter(c => c.aplicar === 'todas')
      .reduce((s, c) => {
        const monto = Utils.parseNum(c.monto);
        return s + (c.prorratear ? monto * porciones : monto);
      }, 0);
  }

  function esc(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escAttr(s='') { return esc(s); }

  return { init, render, totalAplicable };
})();
