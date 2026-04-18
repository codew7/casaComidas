// Routing y arranque
document.addEventListener('DOMContentLoaded', () => {

  const fab = document.getElementById('fab');

  // Bottom nav
  document.querySelectorAll('.bn-item').forEach(btn => {
    btn.addEventListener('click', () => goto(btn.dataset.route));
  });

  const titles = {
    dashboard: 'Inicio',
    ingredientes: 'Ingredientes',
    recetas: 'Recetas',
    costos: 'Costos',
    calculadora: 'Calculadora'
  };

  // Rutas que muestran el FAB para crear elementos
  const fabHandlers = {
    ingredientes: () => Ingredientes.abrirForm(),
    recetas: () => Recetas.abrirForm(),
    costos: () => Costos.abrirForm()
  };

  function goto(route) {
    document.querySelectorAll('.bn-item').forEach(b => b.classList.toggle('active', b.dataset.route === route));
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const page = document.getElementById('page-' + route);
    if (page) page.classList.remove('hidden');
    document.getElementById('page-title').textContent = titles[route] || '';

    // FAB visible sólo en páginas con acción de crear
    if (fabHandlers[route]) {
      fab.classList.remove('hidden');
      fab.onclick = fabHandlers[route];
    } else {
      fab.classList.add('hidden');
      fab.onclick = null;
    }

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
    const redraw = () => {
      const active = document.querySelector('.bn-item.active')?.dataset.route || 'dashboard';
      goto(active);
    };
    DB.subscribe('ingredientes', redraw);
    DB.subscribe('recetas', redraw);
    DB.subscribe('costos', redraw);
    DB.subscribe('productos', redraw);
  });
});
