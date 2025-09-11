const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'variables_entorno.env') });

const { connectDB, testConnection } = require('./db/config');
const productosController = require('./controladores/ProductController');
const salesController = require('./controladores/SalesController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de logging para debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ================= RUTAS PARA PERSONAS =================
app.get('/api/personas', productosController.obtenerTodasPersonas);
app.get('/api/personas/:id', productosController.obtenerPersonaPorId);

// ================= RUTAS PARA ÓRDENES DE VENTA =================
app.get('/api/ordenes-venta', salesController.obtenerTodasOrdenes);
app.get('/api/ordenes-venta/:id', salesController.obtenerOrdenPorId);

// Ruta de salud con verificación de base de datos
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.json({
      status: 'OK',
      database: dbStatus ? 'Conectado' : 'Desconectado',
      timestamp: new Date().toISOString(),
      endpoints: {
        personas: {
          todas: 'GET /api/personas',
          porId: 'GET /api/personas/:id'
        },
        ordenes: {
          todas: 'GET /api/ordenes-venta',
          porId: 'GET /api/ordenes-venta/:id'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'Error en verificación',
      error: error.message
    });
  }
});

// Ruta principal de información
app.get('/', (req, res) => {
  res.json({
    endpoints: {
      health: 'GET /health',
      personas: {
        todas: 'GET /api/personas',
        porId: 'GET /api/personas/:id'
      },
      ordenes: {
        todas: 'GET /api/ordenes-venta',
        porId: 'GET /api/ordenes-venta/:id'
      }
    },
    database: {
      server: process.env.DB_SERVER || 'localhost',
      port: process.env.DB_PORT || '14333',
      name: process.env.DB_NAME || 'AdventureWorks2022'
    }
  });
});
// Manejo de rutas no encontradas (DEBE IR AL FINAL)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    requestedUrl: req.originalUrl,
    availableEndpoints: {
      health: '/health',
      info: '/',
      test: '/test',
      personas: {
        all: '/api/personas',
        byId: '/api/personas/:id'
      },
      orders: {
        all: '/api/ordenes-venta',
        byId: '/api/ordenes-venta/:id'
      }
    }
  });
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    console.log('🔗 Intentando conectar a la base de datos...');
    
    // Conectar a la base de datos primero
    await connectDB();
    console.log('✅ Conectado a la base de datos exitosamente');
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('SERVIDOR INICIADO CORRECTAMENTE');
      console.log('='.repeat(50));
      console.log(`URL: http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/health`);
      console.log(`Personas: http://localhost:${PORT}/api/personas`);
      console.log(`Órdenes: http://localhost:${PORT}/api/ordenes-venta`);
      console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(50) + '\n');
      
      // Test rápido de conexión después de iniciar
      setTimeout(async () => {
        try {
          const dbStatus = await testConnection();
        } catch (error) {
          console.log('Advertencia en verificación de BD:', error.message);
        }
      }, 1000);
    });
    
  } catch (error) {
    console.error('Mensaje:', error.message);
    
    process.exit(1);
  }
};


// Iniciar la aplicación
startServer();

module.exports = app;