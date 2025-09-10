const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: './variables-entorno.env' });

const app = express();
const PUERTO = process.env.PUERTO || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Importar rutas
const rutasProductos = require('./rutas/productos.rutas');

// Usar rutas
app.use('/api/productos', rutasProductos);

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({ 
    mensaje: '¡Bienvenida a mi API de AdventureWorks!',
    estudiante: '[Tu Nombre]',
    universidad: '[Nombre de tu Universidad]'
  });
});

// Manejador de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo salió mal en el servidor',
    mensaje: err.message 
  });
});

// Iniciar servidor
app.listen(PUERTO, () => {
  console.log(`🟢 Servidor ejecutándose en http://localhost:${PUERTO}`);
  console.log(`📊 API disponible en http://localhost:${PUERTO}/api/productos`);
});

module.exports = app;