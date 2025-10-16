import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';

const app = express();
const port = 3001;

// Configuración de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'laboratorio_db',
  user: 'laboratorio_user',
  password: 'laboratorio_password_2025'
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Ruta para ejecutar consultas SQL
app.post('/api/db/query', async (req, res) => {
  try {
    const { query, params } = req.body;
    console.log('Ejecutando consulta:', query);
    console.log('Parámetros:', params);
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en consulta:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Proxy de base de datos funcionando',
    endpoints: {
      health: '/health',
      query: '/api/db/query (POST)',
      ordenes: '/api/ordenes (GET)',
      orden: '/api/ordenes/:id (GET)'
    }
  });
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy de base de datos funcionando' });
});

// Endpoints específicos para órdenes
app.get('/api/ordenes', async (req, res) => {
  try {
    const { skip = 0, limit = 100 } = req.query;
    const result = await pool.query(
      `SELECT * FROM ordenes_trabajo ORDER BY fecha_creacion DESC OFFSET $1 LIMIT $2`,
      [skip, limit]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ordenes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ordenResult = await pool.query('SELECT * FROM ordenes_trabajo WHERE id = $1', [id]);
    if (ordenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    const itemsResult = await pool.query('SELECT * FROM items_orden WHERE orden_id = $1 ORDER BY item_numero', [id]);
    const orden = { ...ordenResult.rows[0], items: itemsResult.rows };
    res.json(orden);
  } catch (error) {
    console.error('Error obteniendo orden:', error);
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Proxy de base de datos ejecutándose en http://localhost:${port}`);
});

// Manejo de errores
process.on('unhandledRejection', (err) => {
  console.error('Error no manejado:', err);
  process.exit(1);
});
