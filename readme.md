# CRUD parametrizado — Node + pg

API REST de `clientes` (rut, nombre, edad) con Query Objects `{text, values}` y respuestas estandarizadas `{ok, data}` / `{ok, mensaje, rowCount}`.

## Endpoints
- GET `/clientes` `?rut` `?edad` `?nombre`
- POST `/clientes`
- PUT `/clientes/:rut`
- DELETE `/clientes` `?rut` `?edad` `?nombre` (no borra si hay más de 1 coincidencia)

## Uso

npm install
DATABASE_URL="postgres://usuario:clave@localhost:5432/clientes" npm run setup
DATABASE_URL="postgres://usuario:clave@localhost:5432/clientes" npm start

Frontend en `public/index.html`.

## Repo
https://github.com/Jesuspereiratona/crud-clientes-queryobjects