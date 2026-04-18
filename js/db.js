// Capa de acceso a Firebase Realtime Database + fallback a localStorage
const DB = (() => {
  const COLLS = ['ingredientes', 'recetas', 'costos', 'productos'];
  const listeners = {};

  function userRoot() {
    const u = App.state.user;
    if (!u) return null;
    return App.db.ref(`usuarios/${u.uid}`);
  }

  function localKey(coll) {
    const u = App.state.user;
    return `cc:${u ? u.uid : 'anon'}:${coll}`;
  }

  function saveLocal(coll, data) {
    try { localStorage.setItem(localKey(coll), JSON.stringify(data)); } catch(e) {}
  }
  function readLocal(coll) {
    try { return JSON.parse(localStorage.getItem(localKey(coll))) || {}; } catch(e) { return {}; }
  }

  // Suscripción en tiempo real
  function subscribe(coll, cb) {
    if (listeners[coll]) return;
    const root = userRoot();
    if (!root) {
      const data = readLocal(coll);
      App.state[coll] = data;
      cb(data);
      return;
    }
    const ref = root.child(coll);
    listeners[coll] = ref;
    ref.on('value', (snap) => {
      const data = snap.val() || {};
      App.state[coll] = data;
      saveLocal(coll, data);
      cb(data);
      setSync(true);
    }, (err) => {
      console.warn('FB read error', err);
      const data = readLocal(coll);
      App.state[coll] = data;
      cb(data);
      setSync(false);
    });
  }

  function unsubscribeAll() {
    Object.values(listeners).forEach(ref => ref.off());
    Object.keys(listeners).forEach(k => delete listeners[k]);
  }

  async function save(coll, item) {
    if (!item.id) item.id = Utils.uid();
    item.actualizadoEn = Date.now();
    if (!item.creadoEn) item.creadoEn = item.actualizadoEn;

    const root = userRoot();
    // Guardar siempre en local como caché
    const local = App.state[coll] || {};
    local[item.id] = item;
    App.state[coll] = local;
    saveLocal(coll, local);

    if (root && App.state.online) {
      try {
        await root.child(`${coll}/${item.id}`).set(item);
      } catch (e) {
        console.warn('FB save error', e);
        setSync(false);
      }
    }
    return item;
  }

  async function remove(coll, id) {
    const root = userRoot();
    const local = App.state[coll] || {};
    delete local[id];
    App.state[coll] = local;
    saveLocal(coll, local);

    if (root && App.state.online) {
      try { await root.child(`${coll}/${id}`).remove(); }
      catch(e) { setSync(false); }
    }
  }

  function all(coll) {
    return Object.values(App.state[coll] || {});
  }
  function get(coll, id) {
    return (App.state[coll] || {})[id];
  }

  function setSync(ok) {
    const dot = document.getElementById('sync-indicator');
    if (!dot) return;
    dot.classList.toggle('offline', !ok);
    dot.title = ok ? 'Sincronizado' : 'Sin conexión';
  }

  window.addEventListener('online', () => { App.state.online = true; setSync(true); syncPending(); });
  window.addEventListener('offline', () => { App.state.online = false; setSync(false); });

  async function syncPending() {
    const root = userRoot();
    if (!root) return;
    for (const coll of COLLS) {
      const local = readLocal(coll);
      try { await root.child(coll).update(local); } catch(e) {}
    }
  }

  return { subscribe, unsubscribeAll, save, remove, all, get, COLLS };
})();
