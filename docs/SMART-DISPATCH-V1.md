# Smart Dispatch V1 — Starken Hub Las Condes

Módulo independiente de MR&B Control Tower para crear una jornada, digitalizar OF manualmente y cuadrar los bultos físicos. Conserva React/Vite, Express y MongoDB/Mongoose. No agrega dependencias ni modifica los datos de los módulos existentes.

## Alcance

- Crear, consultar y editar fecha, móvil, chofer y cantidad de OF esperadas. Operación `Starken` y hub `Las Condes` son los valores del piloto.
- Registrar y editar OF, código de barras opcional, dirección, comuna, bultos, estado de dirección y parada manual.
- Confirmar cada bulto por OF o código de barras y número de bulto. Funciona con escritura manual o lector que actúe como teclado y envíe Enter. No usa cámara.
- Guardar estado de carga pendiente, parcial o escaneado; detectar lecturas y registros duplicados; rechazar códigos desconocidos sin crear órdenes.
- Mostrar los siete KPIs solicitados, más OF por digitalizar, bultos pendientes y excedentes.

OCR, IA, validación geográfica, cámara, importación de nóminas, optimización de rutas y orden de carga automático quedan para etapas posteriores. `OK` significa revisión humana, no geocodificación. V1 no elimina jornadas/OF ni reinicia confirmaciones o el historial de duplicados.

## Rama y revisión

Rama: `feature/smart-dispatch-v1`. Base del PR: `feature/starken-las-condes-v1` (PR #8), que contiene los módulos vigentes de Starken, Operación diaria y Recruit. `main` todavía no incluye esos cambios. Esta base permite revisar exclusivamente Smart Dispatch; no implica fusionar el PR #8 ni este PR. Después de integrar #8 puede ajustarse la base del nuevo PR.

## Ejecutar localmente

Probado con Node.js 24.11.1 y MongoDB 8.0. Se necesita una instancia MongoDB local accesible; los ejemplos usan una base exclusiva de prueba.

```sh
git fetch origin
git switch feature/smart-dispatch-v1
cd backend
npm ci
```

Crear `backend/.env` (está excluido de Git):

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/mrb_smart_dispatch_local
PORT=3001
NODE_ENV=development
```

Desde `backend`, ejecutar `npm run dev`. En otra terminal:

```sh
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Abrir la dirección que muestra Vite, normalmente `http://127.0.0.1:5173`, y seleccionar **Smart Dispatch** en el menú.

Si ya hay un backend en el puerto 3001, usar `PORT=3002` en el backend de prueba y crear `frontend/.env.local`:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:3002/api
```

Reiniciar Vite después de cambiar variables. Esta variable configura solo Smart Dispatch; los módulos anteriores conservan sus URLs. No introducir tokens en variables `VITE_*`. Para desarrollo local, no definir `INTERNAL_API_TOKEN`: la protección existente permite únicamente conexiones loopback sin token. En producción se conserva el acceso interno descrito en `backend/SECURITY-PUBLICATION.md`; este PR no agrega login ni publica el dashboard.

## Prueba manual con datos ficticios

1. Crear una jornada: móvil `DEMO01`, chofer `Chofer de prueba`, fecha de hoy y **3 OF esperadas**.
2. Registrar OF `0001`, código `BAR001`, dirección `Calle de prueba 100`, comuna `Las Condes`, **2 bultos**, dirección **OK · revisada manualmente**, parada **1**.
3. Registrar OF `0002`, **1 bulto**, dirección pendiente de revisión. Debe mostrar 2 OF digitalizadas, 1 dirección OK, 1 por revisar y 3 faltantes (OF).
4. Confirmar `0001`, bulto **1**. Carga parcial, 1 paquete escaneado, 3 faltantes (OF).
5. Repetir `0001`, bulto **1**. Debe advertir duplicado, mantener 1 paquete escaneado y mostrar 1 intento duplicado.
6. Confirmar `BAR001`, bulto **2**, y `0002`, bulto **1**. Resultado: 3 paquetes escaneados, 2 OF completas, 1 OF faltante y 0 bultos pendientes entre las OF conocidas.
7. Confirmar `DESCONOCIDO`, bulto **1**. Debe rechazarlo sin agregar OF ni aumentar los contadores.
8. Editar la dirección de `0001`: vuelve a **Por revisar**. OF y código quedan fijos después del primer bulto confirmado. La parada sigue siendo editable.
9. Recargar el navegador, volver a Smart Dispatch y seleccionar la jornada. Los datos y contadores deben persistir.
10. Crear otra jornada: las mismas OF pueden existir en ella y sus contadores son independientes.

## Definición de KPIs

| Indicador | Unidad y cálculo |
| --- | --- |
| OF esperadas | Cantidad declarada para la jornada. |
| OF digitalizadas | Número de OF únicas registradas. |
| Direcciones OK | OF cuya dirección y comuna se confirmaron manualmente. |
| Por revisar | OF digitalizadas menos direcciones OK. |
| Paquetes escaneados | Cantidad de bultos individuales confirmados. |
| Faltantes (OF) | `max(OF esperadas, OF digitalizadas) - OF con todos sus bultos confirmados`. Incluye OF aún sin registrar. |
| Duplicados | Intentos rechazados acumulados: repetir OF/código al registrar o editar, o confirmar un bulto ya confirmado. No son filas duplicadas guardadas. |

`ofSinDigitalizar = max(0, esperadas - digitalizadas)`; `bultosPendientes` considera solo los bultos de OF conocidas; `ofExcedentes = max(0, digitalizadas - esperadas)`. Nunca restar bultos a una cantidad de OF. Los excedentes se muestran explícitamente incluso cuando su carga está completa.

## Arquitectura y persistencia

- `backend/models/DispatchDay.js`: colección nueva `dispatchdays`, jornada con OF embebidas y esquema validado; no hay migración de colecciones anteriores.
- `backend/services/smartDispatchService.js`: validación de entrada, cuadratura, serialización y cambios con concurrencia optimista. Relee y revalida hasta cinco intentos ante conflicto de versión; después responde 409 para reintentar.
- `backend/utils/smartDispatchValidation.js`: validadores de tipos, identificadores y fechas reales.
- Controlador y rutas propios montados bajo `/api/smart-dispatch`, detrás de `internalAccess` existente.
- `frontend/src/modules/smart-dispatch/`: API, formularios, página y estilos acotados. Integración en `App.jsx`: importación, menú, render condicional y una clase activa para que el menú no cubra Smart Dispatch en pantallas estrechas. Las otras vistas conservan su diseño.

La captura manual pasa por el mismo servicio que podrán usar los futuros adaptadores de OCR/importación/escaneo, sin mezclar reconocimiento con persistencia. La parada es un dato manual nullable; un futuro optimizador deberá aplicar resultados mediante el servicio y sus validaciones.

OF y códigos son texto: conservan ceros iniciales, se recortan espacios externos y se comparan exactamente. Dentro de una jornada comparten un espacio de identificadores único, para que un código nunca coincida con la OF de otra orden. Cada bulto se identifica por su ordinal dentro de la OF (1…N); V1 guarda un código por OF, no un código distinto por bulto. Un futuro lector deberá resolver OF y ordinal antes de confirmar.

La fecha se guarda como `YYYY-MM-DD`, sin convertirla entre zonas horarias. Límites del piloto: 1–1000 OF esperadas, hasta 1000 OF registradas, 1–1000 bultos por OF y parada 1–1000 o `null`. Las direcciones pueden estar incompletas; para marcar OK se requieren dirección y comuna. Cambiarlas invalida OK salvo confirmación explícita en la misma solicitud. No se puede cambiar OF/código después de confirmar un bulto ni reducir bultos por debajo de un ordinal confirmado.

## API

Todas las rutas son internas. La base de esta tabla es `/api/smart-dispatch/days`.

| Método y ruta | Entrada | Respuesta |
| --- | --- | --- |
| `GET /` | — | Lista de jornadas con KPIs, sin órdenes. |
| `POST /` | Cabecera de jornada | 201, jornada completa. |
| `GET /:id` | — | Jornada completa con `ordenes` y `kpis`. |
| `PATCH /:id` | Campos de cabecera a corregir | Jornada actualizada. |
| `POST /:id/orders` | Campos de OF | 201, jornada actualizada. |
| `PATCH /:id/orders/:orderId` | Campos de OF a corregir | Jornada actualizada. |
| `POST /:id/scans` | `{ "codigo": "BAR001", "bulto": 1 }` | Jornada actualizada. |

Cabecera: `{fecha, operacion, hub, movil, chofer, ofEsperadas}`. OF: `{of, codigoBarras, direccion, comuna, bultos, estadoDireccion, parada}`. Los estados de dirección son `por_revisar` y `ok`. Los números deben ser JSON numérico entero, no texto. Se rechazan campos desconocidos y campos de carga enviados directamente. `estadoCarga` y `bultosEscaneados` los administra el servicio.

Los duplicados responden `409 {message, day}` con el estado y contador actualizado; los conflictos de versión agotados responden `409 {message}`. IDs o entradas inválidas responden 400; jornada/OF/código ausente, 404; acceso no autorizado, 401. El cliente conserva el formulario cuando falla y descarta respuestas antiguas al cambiar de jornada.

## Pruebas y verificaciones

Desde `backend`:

```sh
npm test
node --test tests/smartDispatch.test.js
```

La integración MongoDB se omite por defecto. Para ejecutarla, con MongoDB local iniciado:

```powershell
$env:DISPATCH_TEST_MONGODB_URI='mongodb://127.0.0.1:27017'
node --test tests/smartDispatch*.test.js
```

En macOS/Linux:

```sh
DISPATCH_TEST_MONGODB_URI=mongodb://127.0.0.1:27017 node --test tests/smartDispatch*.test.js
```

La prueba acepta únicamente MongoDB local, crea una base temporal `smart_dispatch_test_<pid>_<timestamp>` y la elimina al finalizar. No usa `MONGODB_URI` ni la base operacional. En esta implementación se ejecutó con MongoDB 8.0 aislado en el puerto 27028: **17/17 comprobaciones aprobadas**, incluidas persistencia, carga parcial, duplicados, escrituras concurrentes, validación, aislamiento de jornadas y protección HTTP.

Desde `frontend`:

```sh
npm run build
npx eslint src/modules/smart-dispatch
```

Ambas verificaciones pasan. También se comprobó el flujo manual en navegador con datos ficticios.

### Fallos anteriores, fuera del alcance de este PR

La suite general y el lint completo no están completamente verdes en la rama base `52c6e4a`:

- `tests/internalAccess.test.js`: la prueba de Recruit no simula `findById`, utilizado por su controlador PATCH; espera 200 y recibe 400 al agotarse la espera de MongoDB.
- `tests/recruitApplicantController.test.js`: espera que `utmSource` se ignore, aunque el controlador vigente lo permite explícitamente.
- `npm run lint`: `App.jsx` ya contiene la función `renderDashboard` sin usar.

Se verificó que los archivos de Recruit, sus pruebas y la configuración de lint son idénticos a la rama base. No se alteraron esos módulos para ocultar los fallos.
