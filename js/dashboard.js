const Dashboard = (() => {
  let chartMargenes = null, chartTop = null, filtro = '';

  function init() {
    document.getElementById('search-productos').addEventListener('input', Utils.debounce(e => {
      filtro = e.target.value.toLowerCase();
      renderTabla();
    }, 200));
  }

  function render() {
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

    renderTabla();
    renderCharts();
  }

  function renderTabla() {
    const tbody = document.getElementById('tbl-productos');
    const data = DB.all('productos')
      .filter(p => !filtro || (p.nombre||'').toLowerCase().includes(filtro))
      .sort((a,b) => (b.margen||0) - (a.margen||0));

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="center muted">Aún no guardaste productos. Usá la Calculadora.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(p => {
      const cls = Utils.colorMargen(p.margen || 0);
      const icon = (p.margen||0) < 50 ? '⚠' : (p.margen||0) < 75 ? '·' : '✓';
      return `<tr>
        <td><strong>${esc(p.nombre)}</strong></td>
        <td>${Utils.fmtMoney(p.costoPorcion)}</td>
        <td>${Utils.fmtMoney(p.precio)}</td>
        <td><span class="${cls}">${icon} ${Utils.fmtPct(p.margen)}</span></td>
        <td class="actions"><button class="btn btn-danger btn-sm" data-del="${p.id}">×</button></td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      if (await Utils.confirmar('¿Eliminar producto?')) {
        await DB.remove('productos', b.dataset.del);
        Utils.toast('Producto eliminado', 'info');
      }
    });
  }

  function renderCharts() {
    const prods = DB.all('productos');
    const ctx1 = document.getElementById('chart-margenes')?.getContext('2d');
    const ctx2 = document.getElementById('chart-top')?.getContext('2d');
    if (!ctx1 || !ctx2) return;

    const buckets = { 'Bajo (<50%)': 0, 'Medio (50-75%)': 0, 'Alto (>75%)': 0 };
    prods.forEach(p => {
      const m = p.margen || 0;
      if (m < 50) buckets['Bajo (<50%)']++;
      else if (m < 75) buckets['Medio (50-75%)']++;
      else buckets['Alto (>75%)']++;
    });

    if (chartMargenes) chartMargenes.destroy();
    chartMargenes = new Chart(ctx1, {
      type: 'doughnut',
      data: {
        labels: Object.keys(buckets),
        datasets: [{
          data: Object.values(buckets),
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    const top = [...prods].sort((a,b) => (b.margen||0) - (a.margen||0)).slice(0, 8);
    if (chartTop) chartTop.destroy();
    chartTop = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: top.map(p => p.nombre),
        datasets: [{
          label: 'Margen %',
          data: top.map(p => +(p.margen || 0).toFixed(1)),
          backgroundColor: '#1e40af'
        }]
      },
      options: { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } } }
    });
  }

  function esc(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  return { init, render };
})();
