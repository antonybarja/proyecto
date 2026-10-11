# Mis Gastos

App personal para registrar gastos, para iPhone, Android (APK) y el navegador. Sin servidor ni cuentas: los datos se guardan solo en el dispositivo.

## Funciones

- Agregar, editar y eliminar gastos (monto, categoría, fecha, descripción)
- Ver el total del mes y el reparto por categoría
- Exportar a CSV (para Excel / Google Sheets)
- Copia de seguridad y restauración en JSON
- Funciona sin conexión

## Instalar en iPhone

La app se publica en GitHub Pages: https://antonybarja.github.io/proyecto/

1. Abre ese enlace en **Safari** (tiene que ser Safari).
2. Toca el botón **Compartir** (cuadrado con flecha hacia arriba).
3. Elige **Añadir a pantalla de inicio** → **Añadir**.

Queda un ícono "Gastos" que abre la app a pantalla completa y funciona sin internet.

> Los datos se guardan en el iPhone. Si borras la app de la pantalla de inicio se pierden, así que usa **Copia de seguridad** de vez en cuando (puedes guardarla en Archivos o iCloud Drive).

## Descargar el APK (Android)

GitHub Actions compila el APK automáticamente con cada push:

1. En GitHub, ve a la pestaña **Actions** → workflow **Compilar APK**.
2. Abre la ejecución más reciente (en verde).
3. Abajo, en **Artifacts**, descarga `mis-gastos-apk` (es un .zip con `app-debug.apk` dentro).
4. Pasa el `.apk` al móvil, ábrelo y permite "instalar apps de origen desconocido" cuando lo pida.

También puedes lanzarlo a mano con **Run workflow**.

> Los datos viven solo en el móvil. Si desinstalas la app se pierden, así que usa **Copia de seguridad** de vez en cuando.

## Estructura

- `www/` — la app (HTML, CSS y JavaScript sin dependencias)
- `capacitor.config.json` — configuración de [Capacitor](https://capacitorjs.com/), que convierte la web en app Android
- `.github/workflows/apk.yml` — compila el APK
- `.github/workflows/pages.yml` — publica la app en GitHub Pages (para iPhone)

## Desarrollo

Probarla en el navegador:

```sh
npm run serve
```

Compilar el APK en tu PC (requiere Android Studio / Android SDK y JDK 21):

```sh
npm install
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```
