const Utils = (() => {
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const fmtMoney = (n) => {
    if (n == null || isNaN(n)) return '$0';
    return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const fmtPct = (n) => (n == null || isNaN(n)) ? '0%' : Number(n).toFixed(1) + '%';

  const parseNum = (v) => {
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };

  const debounce = (fn, ms = 250) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  const toast = (msg, type = 'info') => {
    const box = document.getElementById('toasts');
    if (!box) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2500);
    setTimeout(() => el.remove(), 3000);
  };

  const confirmar = (msg) => Promise.resolve(window.confirm(msg));

  const redondear = (valor, paso) => {
    if (!paso || paso <= 0) return valor;
    const p = paso / 100;
    return Math.round(valor / p) * p;
  };

  // Costo unitario = precio / cantidad base (sin merma)
  const costoUnitarioIng = (ing) => {
    const precio = parseNum(ing.precio);
    const cantidad = parseNum(ing.cantidad) || 1;
    if (cantidad <= 0) return 0;
    return precio / cantidad;
  };

  const modal = (() => {
    const backdrop = () => document.getElementById('modal');
    const body = () => document.getElementById('modal-body');
    const foot = () => document.getElementById('modal-foot');
    const title = () => document.getElementById('modal-title');

    function open({ titulo, html, botones = [] }) {
      title().textContent = titulo;
      body().innerHTML = html;
      foot().innerHTML = '';
      botones.forEach(b => {
        const btn = document.createElement('button');
        btn.className = `btn ${b.cls || 'btn-ghost'}`;
        btn.textContent = b.text;
        btn.onclick = async () => {
          const r = b.onClick ? await b.onClick() : true;
          if (r !== false) close();
        };
        foot().appendChild(btn);
      });
      backdrop().classList.remove('hidden');
    }
    function close() { backdrop().classList.add('hidden'); }

    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('modal-close').onclick = close;
      backdrop().addEventListener('click', e => { if (e.target === backdrop()) close(); });
    });

    return { open, close };
  })();

  const colorMargen = (m) => {
    if (m < 50) return 'badge badge-red';
    if (m < 75) return 'badge badge-yellow';
    return 'badge badge-green';
  };

  const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  return { uid, fmtMoney, fmtPct, parseNum, debounce, toast, confirmar, redondear, costoUnitarioIng, modal, colorMargen, esc };
})();
