const sql = require('mssql');
require('dotenv').config({ path: require('path').resolve(__dirname, '../variables_entorno.env') });

// Configuración PARA DOCKER usando variables de entorno
const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 14333,  // Puerto separado
  database: process.env.DB_NAME || 'AdventureWorks2022',
  user: process.env.DB_USER || 'SA',
  password: process.env.DB_PASSWORD || 'SqlServer@2024',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT) || 60000,
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT) || 60000,
    enableArithAbort: true,
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;
let isConnecting = false;

const connectDB = async () => {
  if (pool) {
    return pool; // Ya está conectado
  }

  if (isConnecting) {
    // Esperar a que se complete la conexión en curso
    await new Promise(resolve => setTimeout(resolve, 1000));
    return pool;
  }

  isConnecting = true;
  
  try {
    console.log('🔗 Conectando a SQL Server en Docker...');
    console.log(`   Server: ${config.server},${config.port}`);
    console.log(`   Database: ${config.database}`);
    
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    
    console.log('✅ Conectado exitosamente a SQL Server');
    isConnecting = false;
    return pool;
  } catch (error) {
    isConnecting = false;
    console.error('❌ Error de conexión:', error.message);
    console.log('💡 Tips para solución:');
    console.log('  1. Verifica que el contenedor Docker esté corriendo: docker ps');
    console.log('  2. Verifica el password: SqlServer@2024');
    console.log('  3. Prueba conexión manual: sqlcmd -S localhost,14333 -U SA -P "SqlServer@2024" -Q "SELECT @@VERSION"');
    throw error;
  }
};

const getDB = () => {
  if (!pool) {
    throw new Error('La base de datos no está conectada. Llama a connectDB() primero.');
  }
  return pool;
};

// Función para probar la conexión
const testConnection = async () => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query('SELECT @@VERSION as version');
    console.log('✅ Conexión verificada:', result.recordset[0].version);
    return true;
  } catch (error) {
    console.error('❌ Error al verificar conexión:', error.message);
    return false;
  }
};

// Manejar cierre graceful
process.on('SIGINT', async () => {
  if (pool) {
    await pool.close();
    console.log('🔌 Conexión a BD cerrada');
  }
  process.exit(0);
});

module.exports = { connectDB, getDB, testConnection, sql, config };