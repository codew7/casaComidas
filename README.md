# Casa Comida — Sistema de Costos y Precios

Aplicación web (HTML + JS vanilla + Firebase Realtime Database) para calcular costos por porción, márgenes y precios de productos gastronómicos.

## Características

- **UI mobile-first** con bottom nav estilo app nativa, FAB para crear, bottom sheet modal
- **Ingredientes**: costo unitario automático (precio / cantidad)
- **Recetas**: constructor dinámico con suma en tiempo real
- **Costos adicionales**: prorrateables por porción o fijos por receta
- **Calculadora**: slider de margen en tiempo real, dos métodos (objetivo / sobre costo), redondeo configurable
- **Dashboard**: métricas y lista de productos con margen a color (sin gráficos, foco en datos clave)
- **Firebase Realtime DB** + `localStorage` offline
- **Auth**: email/contraseña o anónimo

## Estructura

```
Casa Comida/
├── index.html
├── css/
│   ├── variables.css
│   ├── global.css
│   ├── layout.css
│   ├── componentes.css
│   └── utilidades.css
├── js/
│   ├── config.js         ← configurá Firebase aquí
│   ├── auth.js
│   ├── db.js
│   ├── ingredientes.js
│   ├── recetas.js
│   ├── costos.js
│   ├── calculadora.js
│   ├── dashboard.js
│   ├── utils.js
│   └── app.js
├── firebase-rules.json
└── README.md
```

## Setup Firebase (5 minutos)

1. Entrá a https://console.firebase.google.com/ y creá un proyecto nuevo.
2. **Authentication** → Sign-in method → Habilitá **Email/Password** y **Anónimo**.
3. **Realtime Database** → Creá una base (región más cercana, ej: `southamerica-east1`) → modo "bloqueado" (luego aplicamos reglas).
4. En **Reglas**, pegá el contenido de `firebase-rules.json` y publicá.
5. **Project settings** → agregá una **Web app** → copiá el objeto `firebaseConfig`.
6. Pegalo en `js/config.js` reemplazando los placeholders.

## Correr en local

Abrí `index.html` directamente en el navegador o usá un servidor simple:

```bash
# con Python 3
python -m http.server 5500
# luego abrí http://localhost:5500
```

## Deploy (opciones)

- **Firebase Hosting**:
  ```bash
  npm i -g firebase-tools
  firebase login
  firebase init hosting
  firebase deploy
  ```
- **GitHub Pages / Netlify / Vercel**: subí el directorio tal cual. Es 100% estático.

## Flujo de uso

1. Ingresás (email o invitado).
2. Cargás **ingredientes** con su precio y merma.
3. Creás **recetas** eligiendo ingredientes y cantidades; el costo se calcula solo.
4. Definís **costos adicionales** (envase, mano de obra, etc.).
5. En **Calculadora** seleccionás receta, ajustás margen con el slider y guardás el producto.
6. En **Dashboard** ves todos los productos, márgenes y gráficos.

## Modelo de datos (Realtime DB)

```
/usuarios/{uid}/
  ingredientes/{id}: { nombre, unidad, cantidad, precio, merma, creadoEn, actualizadoEn }
  recetas/{id}:      { nombre, descripcion, merma, items: [{ ingId, cantidad }], ... }
  costos/{id}:       { nombre, tipo, monto, prorratear, aplicar, ... }
  productos/{id}:    { recetaId, nombre, porciones, costoTotal, costoPorcion, precio, margen, historico: [...] }
```

## Notas

- **Offline-first**: los cambios se guardan en `localStorage` y se sincronizan cuando vuelve la conexión.
- **Sincronización**: el indicador verde/rojo en la topbar muestra el estado.
- **Seguridad**: las reglas de Firebase restringen cada usuario a su propio nodo `/usuarios/{uid}`.

## Próximas ideas (opcionales)

- Exportar a CSV/PDF
- PWA (instalable, offline total)
- Histórico detallado por ingrediente
- Integración con HomePoint
