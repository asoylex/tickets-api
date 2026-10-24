# Tickets API

API para administrar tickets de compra: proveedores, ubicaciones, productos, tickets con sus líneas y los pagos semanales por proveedor. Hecha para la prueba técnica de CFG.

El frontend está en otro repositorio: `tickets-web`.

## Tecnologías

- Node.js y Express
- PostgreSQL con Sequelize (la estructura se crea solo con migraciones)
- JWT para el login
- Docker Compose para levantar la base de datos

## Cómo correrlo

Necesitas Node 20 o más y Docker.

1. Instalar dependencias:

```bash
npm install
```

2. Copiar el archivo de variables:

```bash
cp .env.example .env
```

3. Levantar la base de datos:

```bash
docker compose up -d
```

4. Crear las tablas con las migraciones:

```bash
npm run db:migrate
```

5. Crear el usuario administrador (sin este paso no hay con quién entrar):

```bash
npm run db:seed
```

6. Arrancar el servidor:

```bash
npm run dev
```

La API queda en `http://localhost:3000/api`. Para probar que está viva: `http://localhost:3000/api/health`.

**Usuario de prueba:** `admin@example.com` con la contraseña que pusiste en `ADMIN_PASSWORD` del `.env` (en el ejemplo es `change_me_admin`).

## Variables de entorno

| Variable | Para qué sirve |
|---|---|
| `PORT` | Puerto de la API (3000) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión a PostgreSQL. El puerto es 5433 para no chocar con otro PostgreSQL local |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Firma y duración del token |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Usuario que crea `npm run db:seed` |

## Cargar los datos del Excel

La base arranca vacía. Los datos se cargan desde el frontend: entras como administrador, vas a **Importar** y subes el Excel. El sistema lo analiza primero, te muestra los conflictos (tickets que ya existen, líneas repetidas, líneas con cantidad 0, nombres distintos) y pide confirmación antes de guardar.

En `database/data/tickets-prueba.xlsx` hay un archivo de ejemplo.

## Modelo de datos

- `suppliers`, `lands` y `products`: código único y nombre.
- `tickets`: código único, fecha, proveedor y ubicación.
- `ticket_items`: las líneas de cada ticket (producto, cantidad y precio).
- `users`: correo, contraseña cifrada y rol (`admin` o `user`).

El total de cada línea es cantidad por precio y no se guarda, se calcula. Un producto puede repetirse dentro de un mismo ticket porque en el Excel pasa.

## Endpoints

Todos van bajo `/api` y piden token, menos el login.

| Ruta | Qué hace | Quién |
|---|---|---|
| `POST /auth/login`, `GET /auth/me` | Login y usuario actual | todos |
| `/suppliers`, `/lands`, `/products` | CRUD de catálogos | ver: todos; cambiar: admin |
| `/tickets` y `/tickets/:id/items` | CRUD de tickets y sus líneas | todos (borrar: admin) |
| `GET /payments/weeks` | Semanas que tienen tickets | todos |
| `GET /payments/weekly?year=2023&week=3` | Pagos de una semana ISO por proveedor, con el detalle | todos |
| `/users` | CRUD de usuarios | admin |
| `POST /imports/analyze` y `/imports/execute` | Importar el Excel | admin |

Los listados aceptan `page`, `limit` y `search`.

## Pagos por semana

Se agrupan los tickets de la semana ISO por proveedor y se muestra el total de cada uno con el detalle de tickets y líneas. El total de cada proveedor se redondea a centavos una sola vez, al final.

## Notas

- Las migraciones están en `database/migrations`.
- Los mensajes de error salen en español.
- Los ids son enteros.
- Crear o editar un ticket guarda el ticket y sus líneas en una sola transacción.
- La importación también va en una transacción: si algo falla no queda nada a medias.
