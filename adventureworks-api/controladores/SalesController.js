const { getDB, sql } = require('../db/config.js');

const salesController = {
    // OBTENER TODAS LAS ÓRDENES DE VENTA
  obtenerTodasOrdenes: async (req, res) => {
    try {
      const pool = await getDB();
      const result = await pool.request()
        .execute('uspOrdenesVentaGetAll');
      
      res.json({
        success: true,
        count: result.recordset.length,
        data: result.recordset
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener órdenes de venta',
        error: error.message
      });
    }
  },

  // OBTENER ORDEN DE VENTA POR ID
  obtenerOrdenPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await getDB();
      const result = await pool.request()
        .input('SalesOrderID', sql.Int, id)
        .execute('uspOrdenesVentaGetById');
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Orden de venta no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: result.recordset[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener la orden de venta',
        error: error.message
      });
    }
  }
};

module.exports = salesController;