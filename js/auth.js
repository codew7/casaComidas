const Auth = (() => {
  function init(onReady) {
    App.auth.onAuthStateChanged((u) => {
      App.state.user = u;
      if (u) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        const mail = document.getElementById('user-email');
        if (mail) mail.textContent = u.isAnonymous ? 'Invitado' : (u.email || '');
        onReady();
      } else {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
        DB.unsubscribeAll();
      }
    });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const pass = document.getElementById('login-pass').value;
      try {
        await App.auth.signInWithEmailAndPassword(email, pass);
        Utils.toast('¡Bienvenido!', 'success');
      } catch (err) {
        Utils.toast('Error: ' + err.message, 'error');
      }
    });

    document.getElementById('btn-register').addEventListener('click', async () => {
      const email = document.getElementById('login-email').value.trim();
      const pass = document.getElementById('login-pass').value;
      if (!email || pass.length < 6) return Utils.toast('Email válido y contraseña ≥ 6', 'warn');
      try {
        await App.auth.createUserWithEmailAndPassword(email, pass);
        Utils.toast('Cuenta creada', 'success');
      } catch (err) {
        Utils.toast('Error: ' + err.message, 'error');
      }
    });

    document.getElementById('btn-anon').addEventListener('click', async () => {
      try { await App.auth.signInAnonymously(); }
      catch (err) { Utils.toast('Error: ' + err.message, 'error'); }
    });

    document.getElementById('btn-logout').addEventListener('click', async () => {
      await App.auth.signOut();
      Utils.toast('Sesión cerrada', 'info');
    });
  }

  return { init };
})();
