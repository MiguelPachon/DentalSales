const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const dbConfig = {
  host: 'db',
  user: 'postgres',
  password: 'postgres',
  database: 'dentalsales',
  port: 5432
};

const db = new Pool(dbConfig);

async function connectWithRetry(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await db.query('SELECT 1');
      console.log('Conexión a PostgreSQL exitosa');
      return true;
    } catch (err) {
      console.log(`Esperando conexión a la base de datos... (${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  console.error('No se pudo conectar a la base de datos después de varios intentos');
  process.exit(1);
}

async function ensureTableExists() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        dentist VARCHAR(100),
        amount NUMERIC,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Tabla 'sales' verificada o creada correctamente");
  } catch (err) {
    console.error(" Error creando tabla:", err.message);
  }
}

app.get('/', (req, res) => res.send('API DentalSales lista'));

app.get('/sales', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM sales');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/sales', async (req, res) => {
  const { dentist, amount } = req.body;
  try {
    await db.query('INSERT INTO sales (dentist, amount) VALUES ($1, $2)', [dentist, amount]);
    res.json({ message: 'Venta registrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

(async () => {
  await connectWithRetry();
  await ensureTableExists();
  app.listen(4000, () => console.log('Backend en puerto 4000'));
})();

