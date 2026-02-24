# Análisis actualizado de estructura (Fenologia V2)

## 1) Estructura actual del código (app React Native)

La app mantiene una arquitectura por capas simple:

- `src/screens`: pantallas por dominio funcional (`GestionTomas`, `DatosCampo`, `Mantenedores`).
- `src/navigation`: stacks y navegador principal.
- `src/services`: integración con Supabase y autenticación.
- `src/utils`: utilidades de sincronización offline, caché, ubicación y fotos.
- `supabase/migrations`: definición de esquema SQL remoto.

Esto permite separar UI, navegación y acceso a datos, pero sigue habiendo acoplamiento directo de tablas SQL desde pantallas.

## 2) Estructura de datos en Supabase (migración inicial Fenologia V2)

La migración `supabase/migrations/20260224150003_remote_schema.sql` define un esquema amplio y consistente para:

- Operación principal: `tomas`, `tomas_fenologicas`.
- Captura de campo: `calibracion_frutos`, `conteo_frutos_caidos`.
- Catálogos/mantenedores: `lotes`, `inspectores`, `tipos_estado`, `sector`, `orientaciones`, `zonas`, `lado_variedad`, `clasificacion_tamano`, `cultivos`.

Incluye además:

- PK/UK bien declaradas para catálogos clave.
- FKs relevantes (`tomas_fenologicas.id_toma -> tomas.id_toma`, `codigo_lote -> lotes.codigo_lote`, `inspectores.user_id -> auth.users`).
- Funciones de negocio (`fn_calcular_conteo_frutos_caidos`, `fn_calcular_dias_evaluaciones`) para cálculos automáticos.
- Grants abiertos a `anon` y `authenticated` para varias tablas.

## 3) Encaje entre código app y esquema SQL

Se observa compatibilidad base entre app y tablas principales, porque en el código se usan directamente:

- `tomas`, `tomas_fenologicas`
- `calibracion_frutos`, `conteo_frutos_caidos`
- `lotes`, `inspectores`, `tipos_estado`

Puntos a vigilar en siguiente iteración (branch `fenologiav-v2`):

1. **Columnas con tildes en BD** (`campaña`, `tamaño`): válidas en SQL, pero pueden generar fricción en tipado/serialización JS si luego se tipa fuerte con TS.
2. **RLS deshabilitado** (según captura y grants amplios): funcional para arranque, pero de alto riesgo para producción.
3. **Nombres duplicables por semántica** (`n_de_toma`, `codigo_lote`, `nombre_lote`) en varias tablas: conviene contrato DTO único para evitar payloads inconsistentes.
4. **Lógica en trigger + lógica en app**: evitar recalcular en frontend campos que ya gestiona DB para no divergir.

## 4) Pruebas ejecutadas al levantar la app

Se intentó validar ejecución local:

- `npm run start -- --no-interactive --port 8081`: **OK**, Metro levanta correctamente.
- `npm run android`: **falló por entorno**, no hay `adb` en este contenedor y `gradlew` no ejecutó instalación (`EACCES`).
- `npm test -- --watch=false`: **falló**, Jest no transforma `react-native-url-polyfill/auto` (ESM import) en el setup actual.

## 5) Recomendaciones inmediatas antes de cambios funcionales

1. Crear capa `repositories/` o `data/` para centralizar acceso Supabase por tabla y reducir queries embebidas en pantallas.
2. Definir tipos TS de tablas críticas (mínimo `tomas`, `tomas_fenologicas`, `calibracion_frutos`, `conteo_frutos_caidos`).
3. Corregir setup de pruebas Jest (mock o transform para `react-native-url-polyfill/auto`).
4. Preparar estrategia RLS por rol (`INSPECTOR`, `SUPERVISOR`) antes de pasar a producción.

Con esto, en el branch `fenologiav-v2` podremos avanzar cambios funcionales con menor riesgo de regresiones.
