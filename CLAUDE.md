# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

Casa Comida es una app web 100% estática (HTML + JS vanilla + Firebase) para calcular costos y precios de productos gastronómicos.

**Setup crítico**: antes de cualquier cambio, la app necesita `firebaseConfig` en `js/config.js` (ver "Firebase").

## Architecture

### Filosofía general
- **Mobile-first**: diseño vertical responsive, max-width 520px, bottom nav nativa
- **Offline-first**: localStorage como caché principal, Firebase como destino de sync
- **Modular**: archivos JS separados por feature, IIFE pattern, sin frameworks
- **Sin build**: archivos estáticos puros, se sirven tal cual

### Capas principales

**Persistencia** (`js/db.js`)
- `DB.subscribe(colección, callback)` → suscripción en tiempo real a cambios
- `DB.save(colección, item)` → escribe en local + Firebase (si online)
- `DB.all(colección)` → devuelve todos los items de memoria (`App.state`)
- Fallback a localStorage si Firebase falla
- Patrón: al abrir form, `leerTodasFilas()` (sin filtrar) para re-render; `leerFilas()` (filtrado) solo para guardar

**Autenticación** (`js/auth.js`)
- Email/contraseña o anónimo
- `Auth.init(onReady)` → maneja login automático, llama onReady cuando está autenticado
- Usuario en `App.state.user`

**Routing & UI** (`js/app.js`)
- Bottom nav con 5 secciones (dashboard, ingredientes, recetas, costos, calculadora)
- `goto(route)` → cambia página, activador de navbot, FAB context
- FAB visible solo en páginas con acción: ingredientes, recetas, costos
- Cada módulo tiene `.render()` llamado al entrar a su página

**Formularios & Modales** (`js/utils.js`)
- `Utils.modal.open({ titulo, html, botones })` → bottom sheet modal
- Patrón: innerHTML dentro del modal, listeners en bind(), re-render completo al cambiar datos
- Botones: `{ text, cls, onClick }` → onClick recibe undefined si cancel o el resultado si save

**Módulos feature**
- `Ingredientes`, `Recetas`, `Costos`, `Calculadora`, `Dashboard`
- Cada uno exporta `{ init, render, [abrirForm] }`
- `.render()` → pinta lista/estado actual desde DB
- `.abrirForm(id?)` → abre modal para crear/editar

### Cálculos clave
- **Costo unitario ingrediente**: `precio / cantidad` (sin merma)
- **Costo receta**: suma de (costo_unitario × cantidad) por cada ingrediente + costos adicionales
- **Precio venta**: slider de margen en dos métodos:
  - Objetivo: `costo / (1 - margen%)` — garantiza margen real exacto
  - Sobre costo: `costo × (1 + margen%)` — más simple, margen varía
- **Redondeo**: paso en centavos (0, 50, 100, 500, 10000)

## Desarrollo

### No hay build, no hay npm
- Servidor simple: `python -m http.server 5500`
- O abrír `index.html` directamente (requiere HTTPS/localhost para que Firebase funcione)

### Flujo de cambios
1. Editar archivos CSS o JS
2. Refrescar navegador
3. Probar en DevTools mobile (cmd/ctrl+shift+M, iPhone SE por defecto)

### Testing
- Manual en navegador (DevTools mobile para mobile, resize para desktop)
- Probar con datos reales en ingredientes → recetas → calculadora → dashboard
- Offline: abre DevTools Network, marcar "Offline", seguir usando (localStorage sincroniza al volver online)

## Firebase

### Setup obligatorio
1. https://console.firebase.google.com/ → New project
2. **Authentication** → Sign-in method: Email/Password + Anonymous ✓
3. **Realtime Database** → Create DB, region southamerica-east1 (o la tuya), modo "locked"
4. **Reglas** → copiar `firebase-rules.json` y publicar
5. **Project Settings** → Web app → copiar `firebaseConfig`
6. Pegar en `js/config.js` reemplazando placeholders

Estructura en DB:
```
/usuarios/{uid}/
  ├── ingredientes/{id}
  ├── recetas/{id}
  ├── costos/{id}
  └── productos/{id}
```

Cada usuario ve solo su nodo gracias a las reglas.

## UI/UX Decisions

- **Bottom nav**: 5 botones, ícono + label, active state color + transform up
- **FAB**: naranja (#f97316), visible en ingredientes/recetas/costos
- **Cards (items)**: título izq, precio der, border suave, reusan `.item`
- **Empty state**: ícono grande, mensaje, botón de acción directo
- **Modal**: bottom sheet, handle visual, max-height 92vh, padding safe-area-inset-bottom
- **Paleta**: primario naranja, success verde, danger rojo, texto gris neutro
- **Tipografía**: Inter, max 520px ancho

## Cambios futuros comunes

**Agregar nuevo campo en ingrediente**
1. Editar form HTML en `Ingredientes.abrirForm()`
2. Agregar al objeto `nuevo` antes de `DB.save()`
3. Incluir en `render()` si es relevante

**Agregar nueva sección**
1. `index.html`: agregar `<section class="page hidden" id="page-xxx">`, agregar botón en `.bottom-nav`
2. `js/xxx.js`: módulo con `{ init, render }`
3. `js/app.js`: llamar `XXX.init()`, agregar `if (route === 'xxx') XXX.render()`, agregar handler FAB si aplica
4. `css/layout.css` o `css/componentes.css`: estilos específicos si los necesita

**Integrar con otro sistema**
- La app guarda en `App.state` después de cada sync
- Puedes leer `DB.all('productos')` para exportar datos
- Firebase Rules asegura que el export sea solo datos propios del usuario

## Notas importantes

- **localStorage sync**: el debounce es importante para no saturar localStorage. Ver `DB.subscribe()`
- **Offline**: la app funciona offline gracias a localStorage + lógica en DB. Al volver online, `syncPending()` auto-sincroniza
- **Validaciones**: aplica solo en cliente. Firebase Rules agrega validación en servidor
- **Performance**: se usa debounce en búsquedas y en inputs numéricos para evitar re-renders excesivos
- **Seguridad**: nunca hardcodear `firebaseConfig` en produción (aunque tecnicamente es safe porque solo contiene IDs públicos). El secreto está en las Rules de Firebase
