const path = require("node:path")
const { Pool } = require('pg')
const express = require("express")
const app = express()

const PORT = process.env.PORT || 3000

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:CAMBIA_ESTO@localhost:5432/clientes"
})

app.use(express.static(path.join(__dirname, "/public")))
app.use(express.json())

// GET /clientes → todos, o filtrado por ?rut, ?edad, ?nombre
app.get("/clientes", async (req, res) => {
    const { rut, edad, nombre } = req.query

    let q = { text: "SELECT rut, nombre, edad FROM clientes", values: [] }

    if (rut) q = { text: "SELECT rut, nombre, edad FROM clientes WHERE rut = $1", values: [rut] }
    else if (edad) q = { text: "SELECT rut, nombre, edad FROM clientes WHERE edad = $1", values: [edad] }
    else if (nombre) q = { text: "SELECT rut, nombre, edad FROM clientes WHERE nombre ILIKE $1", values: [nombre + "%"] }

    try {
        const { rows } = await pool.query(q)
        if (!rows.length) return res.status(404).json({ ok: false, mensaje: "Cliente no existe" })
        res.json({ ok: true, data: rows })
    } catch (error) {
        console.error(error)
        res.status(500).json({ ok: false, mensaje: "Error al consultar" })
    }
})

// POST /clientes
app.post("/clientes", async (req, res) => {
    const { rut, nombre, edad } = req.body

    if (isNaN(edad)) return res.status(400).json({ ok: false, mensaje: "edad debe ser numérica" })

    const q = {
        text: "INSERT INTO clientes(rut, nombre, edad) VALUES ($1, $2, $3) RETURNING rut, nombre, edad",
        values: [rut, nombre, edad]
    }

    try {
        const { rows } = await pool.query(q)
        res.status(201).json({ ok: true, data: rows[0] })
    } catch (error) {
        if (error.code === "23505") return res.status(409).json({ ok: false, mensaje: "El rut ya existe" })
        console.error(error)
        res.status(500).json({ ok: false, mensaje: "Error al crear" })
    }
})

// PUT /clientes/:rut → modifica solo nombre
app.put("/clientes/:rut", async (req, res) => {
    const q = {
        text: "UPDATE clientes SET nombre = $1 WHERE rut = $2",
        values: [req.body.nombre, req.params.rut]
    }

    try {
        const { rowCount } = await pool.query(q)
        if (!rowCount) return res.status(404).json({ ok: false, mensaje: "Cliente no existe" })
        res.json({ ok: true, rowCount, mensaje: "Actualizado correctamente" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ ok: false, mensaje: "Error al actualizar" })
    }
})

// DELETE /clientes?rut=  |  ?nombre=  |  ?edad=   (nunca borra más de 1)
app.delete("/clientes", async (req, res) => {
    const { rut, nombre, edad } = req.query

    let select = { text: "SELECT rut FROM clientes WHERE rut = $1", values: [rut] }
    if (nombre) select = { text: "SELECT rut FROM clientes WHERE nombre ILIKE $1", values: [nombre + "%"] }
    else if (edad) select = { text: "SELECT rut FROM clientes WHERE edad = $1", values: [edad] }

    try {
        const match = await pool.query(select)

        if (match.rowCount === 0) return res.status(404).json({ ok: false, mensaje: "Cliente no existe" })
        if (match.rowCount > 1) return res.status(400).json({ ok: false, mensaje: "Hay más de un cliente, refine el criterio" })

        const del = await pool.query({ text: "DELETE FROM clientes WHERE rut = $1", values: [match.rows[0].rut] })
        res.json({ ok: true, rowCount: del.rowCount, mensaje: "Eliminado correctamente" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ ok: false, mensaje: "Error al eliminar" })
    }
})

app.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`)
})