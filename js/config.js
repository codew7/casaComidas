// ============================================================
// CONFIGURACIÓN FIREBASE
// Reemplazá estos valores con los de tu proyecto Firebase.
// Console → Settings → General → Your apps → Web app config.
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyAhLohaL5Ue2br7FG8MPxc3BzWjgZjfHcA",
  authDomain: "casacomidas.firebaseapp.com",
  databaseURL: "https://casacomidas-default-rtdb.firebaseio.com",
  projectId: "casacomidas",
  storageBucket: "casacomidas.firebasestorage.app",
  messagingSenderId: "366164591563",
  appId: "1:366164591563:web:050869c684bc5320cbec4e"
};

firebase.initializeApp(firebaseConfig);

const fbAuth = firebase.auth();
const fbDB = firebase.database();

window.App = {
  config: firebaseConfig,
  auth: fbAuth,
  db: fbDB,
  state: {
    user: null,
    ingredientes: {},
    recetas: {},
    costos: {},
    productos: {},
    online: navigator.onLine
  }
};
