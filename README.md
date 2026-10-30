# Conduit API — RealWorld (auth + artículos)

Backend de autenticación y artículos de la especificación [RealWorld](https://github.com/realworld-apps/realworld) en Node + TypeScript.

## Plan

Primero leí la especificación vigente (OpenAPI y las pruebas Hurl) y anoté en una tabla cada endpoint con su código de respuesta, la forma exacta de las respuestas y los mensajes de error. Con eso definí el alcance: autenticación y artículos (CRUD, lista con filtros y paginación, favoritos), dejando fuera perfiles, comentarios y tags. Después armé el proyecto por capas (rutas → services → repositorios, con la validación aparte), implementé primero la autenticación hasta que pasaron sus pruebas oficiales, luego artículos, y al final agregué pruebas propias y esta documentación.

## Versión de la especificación

- Repositorio: `realworld-apps/realworld` (antes `gothinkster/realworld`)
- Commit: `ebbcdeb` — 26 ago 2026
- Contrato: `specs/api/openapi.yml`, **OpenAPI 2.0.0**

## Cómo correrlo

Requisitos: Node 22 LTS. Para la suite oficial: [Hurl](https://hurl.dev) y una copia de la especificación.

```bash
npm install
cp .env.example .env          # y poner un valor en JWT_SECRET
npm run db:migrate            # crea dev.db
npm run dev                   # http://localhost:3000/api
```

### Pruebas

```bash
npm test                      # pruebas propias (Vitest + Supertest), usan test.db aparte
npm run typecheck             # revisión de tipos

# Suite oficial (con el servidor corriendo; en Windows desde Git Bash)
git clone https://github.com/realworld-apps/realworld.git ../realworld-spec
npm run test:api              # SPEC_DIR y HOST se pueden cambiar con variables de entorno
```

### Resultado

Suite oficial, archivos en alcance:

```
Success auth.hurl            (20 requests)
Success errors_auth.hurl     (20 requests)
Success articles.hurl        (17 requests)
Success errors_articles.hurl (20 requests)
Success pagination.hurl      (7 requests)
Success favorites.hurl       (9 requests)
Executed files: 6 — Succeeded: 6 (100%) — 93 requests
```

Pruebas propias: 3 archivos, 16 pruebas pasando.

## Decisiones

- **Express 5:** si una ruta `async` lanza un error, Express 5 lo manda solo al middleware de errores, sin `try/catch` en cada ruta. Así todos los errores salen en el formato `{ errors: {...} }` desde un solo lugar.
- **Zod:** valida el body y los query params. El mismo esquema sirve para validar en tiempo de ejecución y como tipo de TypeScript, sin duplicar código.
- **SQLite:** no hay que instalar ni levantar nada; quien clone el repo lo corre con `npm install`.
- **Prisma 7.10.1 (fijo):** schema claro, migraciones y tipos generados. Fijé la versión porque `npm install prisma` instalaba la 8.0.0-rc (versión candidata, no estable).
- **JWT + bcryptjs:** el JWT va firmado (no cifrado) y sirve para identificar al usuario sin guardar sesiones. bcryptjs guarda las contraseñas hasheadas; es JavaScript puro, no necesita compilar nada.
- **Vitest + Supertest:** Vitest corre TypeScript sin configuración extra. Supertest hace peticiones a la app sin levantar un puerto; por eso `app.ts` (crea la app) está separado de `server.ts` (hace `listen`).
- **Mismo error para email inexistente y contraseña incorrecta** (`401 credentials invalid`), para no revelar qué emails están registrados.
- **Slug:** título en formato slug + sufijo aleatorio (`mi-articulo-3f9a1c2b`), porque la especificación permite títulos repetidos. El slug **no cambia** al editar el título, para no romper enlaces existentes.
- **Orden de los tags:** la tabla intermedia `ArticleTag` guarda `position`, porque la suite exige que `tagList` salga en el orden en que se envió.
- **`favorited` y `favoritesCount` no se guardan:** se calculan en la consulta. `favorited` depende de quién consulta.

## Arquitectura

```
src/
  app.ts / server.ts     app de Express / arranque del servidor
  config.ts              variables de entorno (no arranca sin JWT_SECRET)
  errors.ts              HttpError y subclases (401, 403, 404, 409, 422)
  validation/            esquemas Zod y helper para responder 422
  routes/                solo HTTP: validar → llamar al service → responder
  services/              lógica de negocio (permisos, hash, tokens, slug)
  repositories/          consultas con Prisma, sin lógica
  middleware/            auth (requireAuth / optionalAuth) y manejo de errores
  lib/                   cliente de Prisma, generador de slugs
tests/
  unit/                  funciones puras (slug)
  integration/           endpoints con Supertest contra una base de datos de prueba
```

## Endpoints

| Método | Endpoint | Auth | Respuesta |
|---|---|---|---|
| POST | /api/users | No | 201 `{user}` |
| POST | /api/users/login | No | 200 `{user}` |
| GET | /api/user | Sí | 200 `{user}` |
| PUT | /api/user | Sí | 200 `{user}` |
| GET | /api/articles | Opcional | 200 `{articles, articlesCount}` |
| GET | /api/articles/feed | Sí | 200 `{articles, articlesCount}` |
| POST | /api/articles | Sí | 201 `{article}` |
| GET | /api/articles/:slug | Opcional | 200 `{article}` |
| PUT | /api/articles/:slug | Sí (autor) | 200 `{article}` |
| DELETE | /api/articles/:slug | Sí (autor) | 204 |
| POST | /api/articles/:slug/favorite | Sí | 200 `{article}` |
| DELETE | /api/articles/:slug/favorite | Sí | 200 `{article}` |

Autenticación con el encabezado `Authorization: Token <jwt>` (no `Bearer`).

## Desviaciones

**Feed**
- `/api/articles/feed` existe y pide token (sin token → 401, como pide `errors_articles.hurl`).
- Siempre regresa `{ "articles": [], "articlesCount": 0 }`: seguir perfiles no está en el alcance, entonces nadie sigue a nadie y el feed queda vacío.
- Está declarada antes de `/api/articles/:slug` para que "feed" no se tome como slug.

**Comentarios**
- No están en el alcance.
- `errors_authorization.hurl` mezcla artículos y comentarios. Corriéndolo con `hurl --continue-on-error`, los casos de artículos pasan (403 al editar o borrar un artículo ajeno) y solo fallan los de comentarios.

**Perfiles, follow y tags**
- Fuera de alcance; `profiles.hurl`, `errors_profiles.hurl`, `feed.hurl`, `comments.hurl`, `errors_comments.hurl` y `tags.hurl` no aplican.
- El `author` de cada artículo sí trae `username`, `bio`, `image` y `following` (siempre `false`).

## Mejoras pendientes

- Comentarios (3 endpoints), con lo que `errors_authorization.hurl` pasaría completo.
- CORS: para conectar un frontend en otro dominio se agregaría el middleware `cors` con los orígenes permitidos.
- `GET /api/tags` y perfiles/follow para completar la especificación.

## Uso de IA

Usé IA como apoyo para revisar la especificación, verificar versiones, revisar código y acelerar partes de la implementación y las pruebas. Las decisiones, el alcance y las desviaciones son míos, y verifiqué todo contra la suite oficial.
