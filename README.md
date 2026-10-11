# Mis Gastos

App personal para registrar gastos, para Android (APK) y para el navegador. Sin servidor ni cuentas: los datos se guardan solo en el dispositivo.

## Funciones

- Agregar, editar y eliminar gastos (monto, categoría, fecha, descripción)
- Ver el total del mes y el reparto por categoría
- Exportar a CSV (para Excel / Google Sheets)
- Copia de seguridad y restauración en JSON
- Funciona sin conexión

## Descargar el APK

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
