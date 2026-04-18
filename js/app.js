// Orquestación general: routing, suscripciones, inicialización
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar móvil
  const sidebar = document.getElementById('sidebar');
  document.getElementById('sidebar-open').onclick = () => sidebar.classList.add('open');
  document.getElementById('sidebar-close').onclick = () => sidebar.classList.remove('open');

  // Routing
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => goto(btn.dataset.route));
  });

  function goto(route) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.route === route));
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const page = document.getElementById('page-' + route);
    if (page) page.classList.remove('hidden');
    const titles = {
      dashboard: 'Dashboard',
      ingredientes: 'Ingredientes',
      recetas: 'Recetas',
      costos: 'Costos adicionales',
      calculadora: 'Calculadora'
    };
    document.getElementById('page-title').textContent = titles[route] || '';
    sidebar.classList.remove('open');

    if (route === 'dashboard') Dashboard.render();
    if (route === 'ingredientes') Ingredientes.render();
    if (route === 'recetas') Recetas.render();
    if (route === 'costos') Costos.render();
    if (route === 'calculadora') Calculadora.render();
  }
  window.goto = goto;

  // Inicializar módulos
  Ingredientes.init();
  Recetas.init();
  Costos.init();
  Calculadora.init();
  Dashboard.init();

  Auth.init(() => {
    // Una vez autenticado, suscribirse a datos
    const redraw = () => {
      const active = document.querySelector('.nav-item.active')?.dataset.route || 'dashboard';
      goto(active);
    };
    DB.subscribe('ingredientes', redraw);
    DB.subscribe('recetas', redraw);
    DB.subscribe('costos', redraw);
    DB.subscribe('productos', redraw);
  });
});
