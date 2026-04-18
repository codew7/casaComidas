const Calculadora = (() => {
  const el = {};
  let recetaActual = null;

  function init() {
    el.receta = document.getElementById('calc-receta');
    el.porciones = document.getElementById('calc-porciones');
    el.metodo = document.getElementById('calc-metodo');
    el.margen = document.getElementById('calc-margen');
    el.margenLabel = document.getElementById('calc-margen-label');
    el.redondeo = document.getElementById('calc-redondeo');
    el.btnSave = document.getElementById('btn-save-precio');

    ['change', 'input'].forEach(ev => {
      el.receta.addEventListener(ev, recalc);
      el.porciones.addEventListener(ev, recalc);
      el.metodo.addEventListener(ev, recalc);
      el.redondeo.addEventListener(ev, recalc);
      el.margen.addEventListener(ev, () => {
        el.margenLabel.textContent = el.margen.value + '%';
        recalc();
      });
    });

    el.btnSave.onclick = guardar;
  }

  function render() {
    const recs = DB.all('recetas').sort((a,b) => a.nombre.localeCompare(b.nombre));
    const actual = el.receta.value;

    if (!recs.length) {
      el.receta.innerHTML = '<option value="">Primero creá una receta</option>';
      el.receta.disabled = true;
    } else {
      el.receta.disabled = false;
      el.receta.innerHTML = '<option value="">Elegir receta...</option>' +
        recs.map(r => `<option value="${r.id}" ${r.id===actual?'selected':''}>${Utils.esc(r.nombre)}</option>`).join('');
    }
    recalc();
  }

  function recalc() {
    const recId = el.receta.value;
    recetaActual = recId ? DB.get('recetas', recId) : null;
    const porciones = Math.max(1, Utils.parseNum(el.porciones.value) || 1);

    if (!recetaActual) {
      setResult({ ing: 0, adic: 0, porcion: 0, precio: 0, margen: 0 });
      renderHist(null);
      return;
    }

    const costoIng = Recetas.costoReceta(recetaActual);
    const costoAdic = Costos.totalAplicable(porciones);
    const total = costoIng + costoAdic;
    const porcion = total / porciones;

    const m = Utils.parseNum(el.margen.value);
    let precioPorcion;
    if (el.metodo.value === 'objetivo') {
      const deseado = Math.min(99.9, m) / 100;
      precioPorcion = porcion / (1 - deseado);
    } else {
      precioPorcion = porcion * (1 + m / 100);
    }

    const paso = Utils.parseNum(el.redondeo.value);
    precioPorcion = Utils.redondear(precioPorcion, paso);

    const margenReal = precioPorcion > 0 ? ((precioPorcion - porcion) / precioPorcion) * 100 : 0;

    setResult({ ing: costoIng, adic: costoAdic, porcion, precio: precioPorcion, margen: margenReal });
    renderHist(recetaActual);
  }

  function setResult(r) {
    document.getElementById('res-ing').textContent = Utils.fmtMoney(r.ing);
    document.getElementById('res-adic').textContent = Utils.fmtMoney(r.adic);
    document.getElementById('res-porcion').textContent = Utils.fmtMoney(r.porcion);
    document.getElementById('res-precio').textContent = Utils.fmtMoney(r.precio);
    document.getElementById('res-margen').textContent = Utils.fmtPct(r.margen);
  }

  function renderHist(rec) {
    const ul = document.getElementById('hist-precios');
    const wrap = document.getElementById('hist-wrap');
    if (!rec) { wrap.style.display = 'none'; return; }
    const prod = DB.all('productos').find(p => p.recetaId === rec.id);
    const h = (prod && prod.historico) || [];
    if (!h.length) { wrap.style.display = 'none'; return; }
    wrap.style.display = '';
    ul.innerHTML = h.slice(-5).reverse().map(x =>
      `<li><span class="muted">${new Date(x.fecha).toLocaleDateString('es-AR')}</span><span><strong>${Utils.fmtMoney(x.precio)}</strong> · ${Utils.fmtPct(x.margen)}</span></li>`
    ).join('');
  }

  async function guardar() {
    if (!recetaActual) return Utils.toast('Elegí una receta primero', 'warn');
    const porciones = Math.max(1, Utils.parseNum(el.porciones.value) || 1);
    const costoIng = Recetas.costoReceta(recetaActual);
    const costoAdic = Costos.totalAplicable(porciones);
    const total = costoIng + costoAdic;
    const porcion = total / porciones;

    const precioTxt = document.getElementById('res-precio').textContent;
    const precio = Utils.parseNum(precioTxt.replace(/[^\d.,-]/g,'').replace('.','').replace(',','.'));
    const margenReal = precio > 0 ? ((precio - porcion) / precio) * 100 : 0;

    const existente = DB.all('productos').find(p => p.recetaId === recetaActual.id);
    const producto = existente || { recetaId: recetaActual.id, nombre: recetaActual.nombre, historico: [] };
    producto.nombre = recetaActual.nombre;
    producto.porciones = porciones;
    producto.costoTotal = total;
    producto.costoPorcion = porcion;
    producto.precio = precio;
    producto.margen = margenReal;
    producto.historico = (producto.historico || []).concat({ fecha: Date.now(), precio, margen: margenReal }).slice(-10);

    await DB.save('productos', producto);
    Utils.toast('Producto guardado ✓', 'success');
  }

  return { init, render, recalc };
})();
