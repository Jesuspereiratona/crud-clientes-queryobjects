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
app.use(express.urlencoded())

// GET de todoo
app.get("/clientes", async (req, res) => {
    const { edad, edadMin, edadMax, nombre } = req.query

    let sql = "SELECT * FROM clientes"
    let values = []

    if (edadMin && edadMax) {
        sql += " WHERE edad BETWEEN $1 AND $2"
        values = [edadMin, edadMax]
    } else if (edad) {
        sql += " WHERE edad = $1"
        values = [edad]
    } else if (nombre) {
        sql += " WHERE nombre ILIKE $1"
        values = [nombre + "%"]
    }

    try {
        const result = await pool.query(sql, values)
        if (!result.rowCount) {
            return res.status(404).json({ error: "no hay clientes que cumplan con el criterio" })
        }
        res.json({ data: result.rows, count: result.rowCount })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Hubo un error al consultar los datos." })
    }
})

//get rut de data s
app.get("/clientes/:rut", async (req, res) => {
    const { rut } = req.params

    try {
        const result = await pool.query("SELECT * FROM clientes WHERE rut = $1", [rut])
        if (!result.rowCount) {
            return res.status(404).json({ error: "cliente no existe" })
        }
        res.json({ data: result.rows[0] })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Hubo un error al consultar los datos." })
    }
})

app.post("/clientes", async (req, res) => {
    const { nombre, rut, edad } = req.body

    if (isNaN(edad)) {
        return res.status(400).json({ error: "edad debe ser numérica" })
    }

    try {
        const result = await pool.query({
            text: "INSERT INTO clientes(rut, nombre, edad) VALUES ($1, $2, $3) RETURNING *",
            values: [rut, nombre, edad]
        })
        res.status(201).json({ data: result.rows[0] })
    } catch (error) {
        console.error(error)
        if (error.code === "23505") { // llave duplicada
            return res.status(409).json({ error: "ya existe un cliente con ese rut" })
        }
        res.status(500).json({ error: "Hubo un error al insertar el nuevo registro." })
    }
})

// put pa cambiar csnt name 
app.put("/clientes/:rut", async (req, res) => {
    const { rut } = req.params
    const { nombre } = req.body

    try {
        const result = await pool.query({
            text: "UPDATE clientes SET nombre = $1 WHERE rut = $2 RETURNING *",
            values: [nombre, rut]
        })
        if (!result.rowCount) {
            return res.status(404).json({ error: "cliente no existe" })
        }
        res.json({ data: result.rows[0] })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "No se pudo editar el recurso" })
    }
})

// chao por rut 
app.delete("/clientes/:rut", async (req, res) => {
    const { rut } = req.params

    try {
        const result = await pool.query("DELETE FROM clientes WHERE rut = $1 RETURNING *", [rut])
        if (!result.rowCount) {
            return res.status(404).json({ error: "cliente no existe" })
        }
        res.json({ mensaje: "cliente eliminado", data: result.rows[0] })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "No se pudo eliminar el recurso" })
    }
})

// borrar clientes max min function de htm
app.delete("/clientes", async (req, res) => {
    const { edad, edadMin, edadMax } = req.query

    let sql = "DELETE FROM clientes WHERE"
    let values = []

    if (edadMin && edadMax) {
        sql += " edad BETWEEN $1 AND $2"
        values = [edadMin, edadMax]
    } else if (edad) {
        sql += " edad = $1"
        values = [edad]
    } else {
        return res.status(400).json({ error: "indique edad o edadMin/edadMax" })
    }

    try {
        const result = await pool.query(sql + " RETURNING nombre", values)
        if (!result.rowCount) {
            return res.status(404).json({ error: "no hay clientes que cumplan con el criterio" })
        }
        res.json({ nombres: result.rows.map(c => c.nombre) })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "No se pudo eliminar el recurso" })
    }
})

app.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`)
})