const { getDB, sql } = require('../db/config.js');

const salesController = {
  // ==================== OPERACIONES GET ====================

  // OBTENER TODAS LAS ÓRDENES DE VENTA
  obtenerTodasOrdenes: async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const pool = await getDB();
      const result = await pool.request()
        .input('PageSize', sql.Int, parseInt(limit))
        .input('PageNumber', sql.Int, parseInt(page))
        .execute('uspOrdenesGetAll');
      
      res.json({
        success: true,
        count: result.recordset.length,
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.recordset.length, // En una app real, deberías tener un COUNT total
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
      
      // Validar que el ID sea un número
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'El ID debe ser un número válido'
        });
      }
      
      const pool = await getDB();
      const result = await pool.request()
        .input('SalesOrderID', sql.Int, parseInt(id))
        .execute('uspOrdenesGetById');
      
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
  },

  // ==================== OPERACIONES POST ====================

  // CREAR NUEVA ORDEN DE VENTA
  crearOrden: async (req, res) => {
    try {
      const {
        CustomerID,
        ShipDate,
        DueDate,
        Status = 1,
        OnlineOrderFlag = 1,
        SubTotal,
        TaxAmt,
        Freight,
        Comment = null
      } = req.body;

      // Validaciones básicas
      if (!CustomerID || !ShipDate || !DueDate || !SubTotal) {
        return res.status(400).json({
          success: false,
          message: 'CustomerID, ShipDate, DueDate y SubTotal son obligatorios'
        });
      }

      const pool = await getDB();
      const result = await pool.request()
        .input('CustomerID', sql.Int, CustomerID)
        .input('ShipDate', sql.Date, ShipDate)
        .input('DueDate', sql.Date, DueDate)
        .input('Status', sql.TinyInt, Status)
        .input('OnlineOrderFlag', sql.Bit, OnlineOrderFlag)
        .input('SubTotal', sql.Money, SubTotal)
        .input('TaxAmt', sql.Money, TaxAmt || 0)
        .input('Freight', sql.Money, Freight || 0)
        .input('Comment', sql.NVarChar(128), Comment)
        .execute('uspOrdenesCreate');
      
      res.status(201).json({
        success: true,
        message: 'Orden de venta creada exitosamente',
        orderId: result.recordset[0].SalesOrderID
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear orden de venta',
        error: error.message
      });
    }
  },

  // ==================== OPERACIONES PUT ====================

  // ACTUALIZAR ORDEN DE VENTA
  actualizarOrden: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        Status,
        ShipDate,
        DueDate,
        Comment
      } = req.body;

      // Validar que el ID sea un número
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'El ID debe ser un número válido'
        });
      }

      // Validar que al menos un campo sea proporcionado
      if (!Status && !ShipDate && !DueDate && !Comment) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos un campo para actualizar (Status, ShipDate, DueDate o Comment)'
        });
      }

      const pool = await getDB();
      const result = await pool.request()
        .input('SalesOrderID', sql.Int, parseInt(id))
        .input('Status', sql.TinyInt, Status)
        .input('ShipDate', sql.Date, ShipDate)
        .input('DueDate', sql.Date, DueDate)
        .input('Comment', sql.NVarChar(128), Comment)
        .execute('uspOrdenesUpdate');
      
      if (result.recordset[0].RowsAffected === 0) {
        return res.status(404).json({
          success: false,
          message: 'Orden de venta no encontrada'
        });
      }
      
      res.json({
        success: true,
        message: 'Orden de venta actualizada exitosamente',
        rowsAffected: result.recordset[0].RowsAffected
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar orden de venta',
        error: error.message
      });
    }
  },

  // ==================== OPERACIONES DELETE ====================

  // ELIMINAR ORDEN DE VENTA
  eliminarOrden: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validar que el ID sea un número
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'El ID debe ser un número válido'
        });
      }
      
      const pool = await getDB();
      const result = await pool.request()
        .input('SalesOrderID', sql.Int, parseInt(id))
        .execute('uspOrdenesDelete');
      
      const { Success, Message } = result.recordset[0];
      
      if (!Success) {
        return res.status(400).json({
          success: false,
          message: Message
        });
      }
      
      res.json({
        success: true,
        message: Message
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar orden de venta',
        error: error.message
      });
    }
  },

  // ==================== OPERACIONES ADICIONALES ====================

  // OBTENER ÓRDENES POR CLIENTE
  obtenerOrdenesPorCliente: async (req, res) => {
    try {
      const { customerId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      if (isNaN(customerId)) {
        return res.status(400).json({
          success: false,
          message: 'El ID del cliente debe ser un número válido'
        });
      }

      const pool = await getDB();
      const result = await pool.request()
        .input('CustomerID', sql.Int, parseInt(customerId))
        .query(`
          SELECT 
            SalesOrderID,
            OrderDate,
            DueDate,
            ShipDate,
            Status,
            TotalDue
          FROM Sales.SalesOrderHeader 
          WHERE CustomerID = @CustomerID
          ORDER BY OrderDate DESC
          OFFSET (${(parseInt(page) - 1) * parseInt(limit)}) ROWS
          FETCH NEXT ${parseInt(limit)} ROWS ONLY
        `);
      
      res.json({
        success: true,
        count: result.recordset.length,
        page: parseInt(page),
        limit: parseInt(limit),
        customerId: parseInt(customerId),
        data: result.recordset
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener órdenes del cliente',
        error: error.message
      });
    }
  },

  // OBTENER ESTADÍSTICAS DE ÓRDENES
  obtenerEstadisticas: async (req, res) => {
    try {
      const pool = await getDB();
      const result = await pool.request()
        .query(`
          SELECT 
            COUNT(*) as TotalOrdenes,
            SUM(TotalDue) as ValorTotal,
            AVG(TotalDue) as PromedioOrden,
            MIN(OrderDate) as OrdenMasAntigua,
            MAX(OrderDate) as OrdenMasReciente
          FROM Sales.SalesOrderHeader
        `);
      
      res.json({
        success: true,
        data: result.recordset[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }
};

module.exports = salesController;