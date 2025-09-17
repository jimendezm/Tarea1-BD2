const sql = require('mssql');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ 
  path: path.resolve(__dirname, '../variables_entorno.env') 
});

// Configuración optimizada para Docker
const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 14333,
  database: process.env.DB_NAME || 'AdventureWorks2022',
  user: process.env.DB_USER || 'SA',
  password: process.env.DB_PASSWORD || 'SqlServer@2024',
  options: {
    encrypt: false, // MUST be false for Docker
    trustServerCertificate: true, // MUST be true for self-signed certs
    connectTimeout: 60000,
    requestTimeout: 60000,
    enableArithAbort: true,
    // Opciones críticas para evitar 'socket hang up'
    useUTC: true,
    abortTransactionOnError: false,
    multiSubnetFailover: false,
    packetSize: 4096,
    tdsVersion: '7_4'
  },
  pool: {
    max: 5, // REDUCIDO: Menos conexiones para Docker
    min: 1,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 60000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  }
};

let pool;
let connectionAttempts = 0;
const MAX_ATTEMPTS = 3;

const connectDB = async () => {
  if (pool && pool.connected) {
    return pool;
  }

  if (connectionAttempts >= MAX_ATTEMPTS) {
    throw new Error('Máximo de intentos de conexión alcanzado');
  }

  connectionAttempts++;
  
  try {
    console.log(`Intento ${connectionAttempts}/${MAX_ATTEMPTS}: Conectando a SQL Server...`);
    console.log(`   → Servidor: ${config.server}:${config.port}`);
    console.log(`   → Base de datos: ${config.database}`);
    console.log(`   → Usuario: ${config.user}`);
    
    // Crear nuevo pool con configuración optimizada
    pool = new sql.ConnectionPool(config);
    
    // Manejar eventos de error del pool
    pool.on('error', err => {
      console.error('Error en el pool de conexiones:', err.message);
    });
    
    // Conectar con timeout manual
    const connectionPromise = pool.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout de conexión')), 30000)
    );
    
    await Promise.race([connectionPromise, timeoutPromise]);
    
    console.log('Conectado exitosamente a SQL Server');
    connectionAttempts = 0; // Resetear contador
    
    return pool;
  } catch (error) {
    console.error(`Error de conexión (intento ${connectionAttempts}):`, error.message);
    
    // Cerrar pool si existe
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.log('Error cerrando pool:', closeError.message);
      }
      pool = null;
    }
    
    if (connectionAttempts >= MAX_ATTEMPTS) {
      
      throw error;
    }
    
    // Esperar antes de reintentar
    await new Promise(resolve => setTimeout(resolve, 2000));
    return connectDB();
  }
};

const getDB = () => {
  if (!pool || !pool.connected) {
    throw new Error('La base de datos no está conectada. Ejecuta connectDB() primero.');
  }
  return pool;
};

// Función mejorada para probar conexión
const testConnection = async () => {
  try {
    const currentPool = await connectDB();
    const result = await currentPool.request().query('SELECT @@VERSION as version');
    console.log('Conexión verificada:', result.recordset[0].version.substring(0, 50) + '...');
    return true;
  } catch (error) {
    console.error('Error al verificar conexión:', error.message);
    return false;
  }
};

// Función para verificar estado simple
const checkSimpleConnection = async () => {
  try {
    // Conexión simple sin pooling para diagnóstico
    const simpleConfig = {
      server: config.server,
      port: config.port,
      user: config.user,
      password: config.password,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 10000,
        requestTimeout: 10000
      }
    };
    
    const simplePool = new sql.ConnectionPool(simpleConfig);
    await simplePool.connect();
    const result = await simplePool.request().query('SELECT 1 as test');
    await simplePool.close();
    
    return result.recordset[0].test === 1;
  } catch (error) {
    console.log('Conexión simple falló:', error.message);
    return false;
  }
};

// Manejar cierre graceful
process.on('SIGINT', async () => {
  console.log('\nCerrando conexiones...');
  if (pool) {
    try {
      await pool.close();
      console.log('Conexión a BD cerrada correctamente');
    } catch (error) {
      console.log('Error cerrando conexión:', error.message);
    }
  }
  process.exit(0);
});

// Verificar conexión al cargar el módulo
console.log('Módulo de base de datos cargado');
checkSimpleConnection().then(success => {
  if (success) {
    console.log('Conexión simple: OK');
  }
});

module.exports = { 
  connectDB, 
  getDB, 
  testConnection, 
  checkSimpleConnection,
  sql, 
  config 
};