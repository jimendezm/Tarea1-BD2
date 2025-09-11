const { getDB, sql } = require('../db/config.js');

const productosController = {
  // OBTENER TODAS LAS PERSONAS
  obtenerTodasPersonas: async (req, res) => {
    try {
      const pool = await getDB();
      const result = await pool.request()
        .execute('uspPersonasGetAll');
      
      res.json({
        success: true,
        count: result.recordset.length,
        data: result.recordset
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener personas',
        error: error.message
      });
    }
  },

  // OBTENER PERSONA POR ID
  obtenerPersonaPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await getDB();
      const result = await pool.request()
        .input('BusinessEntityID', sql.Int, id)
        .execute('uspPersonasGetById');
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Persona no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: result.recordset[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener la persona',
        error: error.message
      });
    }
  },

  
};

module.exports = productosController;