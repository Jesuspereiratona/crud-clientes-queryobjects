const { Client } = require("pg")

const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:CAMBIA_ESTO@localhost:5432/clientes",
})

const setupDB = async () => {
    try {
        await client.connect()
        await client.query(`DROP TABLE IF EXISTS clientes;`)
        await client.query(`
            CREATE TABLE IF NOT EXISTS clientes (
                rut    VARCHAR(20) PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                edad   INT NOT NULL
            );
        `)

        await client.query(`
            INSERT INTO clientes(rut, nombre, edad)
            VALUES ('18.555.666-5', 'Clementina Guillerma Caceres', 31),
                    ('11.222.333-4', 'Huachimingo Perejil', 50);
        `)

        console.log("Base de datos inicializada con éxito")

    } catch (error) {
        console.error(error)
    } finally {
        await client.end()
        console.log("Proceso terminado")
    }
}

setupDB()