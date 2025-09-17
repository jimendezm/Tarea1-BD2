USE AdventureWorks2022;
GO


-- 1. SELECT - Obtener todas las órdenes

CREATE PROCEDURE uspOrdenesGetAll
    @PageSize INT = 50,
    @PageNumber INT = 1
AS
BEGIN
    SELECT 
        SalesOrderID,
        RevisionNumber,
        OrderDate,
        DueDate,
        ShipDate,
        Status,
        OnlineOrderFlag,
        SalesOrderNumber,
        CustomerID,
        SubTotal,
        TaxAmt,
        Freight,
        TotalDue,
        Comment,
        ModifiedDate
    FROM Sales.SalesOrderHeader
    ORDER BY OrderDate DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- 2. SELECT - Obtener orden por ID

CREATE PROCEDURE uspOrdenesGetById
    @SalesOrderID INT
AS
BEGIN
    SELECT 
        SalesOrderID,
        RevisionNumber,
        OrderDate,
        DueDate,
        ShipDate,
        Status,
        OnlineOrderFlag,
        SalesOrderNumber,
        CustomerID,
        SubTotal,
        TaxAmt,
        Freight,
        TotalDue,
        Comment,
        ModifiedDate
    FROM Sales.SalesOrderHeader 
    WHERE SalesOrderID = @SalesOrderID;
END;
GO

-- 3. INSERT - Crear nueva orden (versión simplificada)

CREATE PROCEDURE uspOrdenesCreate
    @CustomerID INT,
    @ShipDate DATE,
    @DueDate DATE,
    @Status TINYINT = 1,
    @OnlineOrderFlag BIT = 1,
    @SubTotal MONEY,
    @TaxAmt MONEY,
    @Freight MONEY
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        INSERT INTO Sales.SalesOrderHeader (
            RevisionNumber, OrderDate, DueDate, ShipDate,
            Status, OnlineOrderFlag, SalesOrderNumber,
            CustomerID, SubTotal, TaxAmt, Freight, TotalDue,
            ModifiedDate
        )
        VALUES (
            1, -- RevisionNumber
            GETDATE(), -- OrderDate
            @DueDate,
            @ShipDate,
            @Status,
            @OnlineOrderFlag,
            'SO' + CAST(NEXT VALUE FOR Sales.SalesOrderNumberSeq AS NVARCHAR(20)),
            @CustomerID,
            @SubTotal,
            @TaxAmt,
            @Freight,
            @SubTotal + @TaxAmt + @Freight, -- TotalDue
            GETDATE()
        );
        
        SELECT SCOPE_IDENTITY() AS SalesOrderID;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END;
GO

-- 4. UPDATE - Actualizar orden

CREATE PROCEDURE uspOrdenesUpdate
    @SalesOrderID INT,
    @Status TINYINT,
    @ShipDate DATE = NULL,
    @DueDate DATE = NULL,
    @Comment NVARCHAR(128) = NULL
AS
BEGIN
    UPDATE Sales.SalesOrderHeader
    SET 
        Status = @Status,
        ShipDate = @ShipDate,
        DueDate = @DueDate,
        Comment = @Comment,
        ModifiedDate = GETDATE()
    WHERE SalesOrderID = @SalesOrderID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- 5. DELETE - Eliminar orden
CREATE PROCEDURE uspOrdenesDelete
    @SalesOrderID INT
AS
BEGIN
    DECLARE @Success BIT = 0;
    DECLARE @Message NVARCHAR(200);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        IF NOT EXISTS (SELECT 1 FROM Sales.SalesOrderHeader WHERE SalesOrderID = @SalesOrderID)
        BEGIN
            SET @Message = 'La orden no existe';
        END
        ELSE IF EXISTS (SELECT 1 FROM Sales.SalesOrderDetail WHERE SalesOrderID = @SalesOrderID)
        BEGIN
            SET @Message = 'No se puede eliminar: la orden tiene detalles asociados';
        END
        ELSE
        BEGIN
            DELETE FROM Sales.SalesOrderHeader WHERE SalesOrderID = @SalesOrderID;
            SET @Success = 1;
            SET @Message = 'Orden eliminada exitosamente';
        END
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @Success = 0;
        SET @Message = 'Error al eliminar: ' + ERROR_MESSAGE();
    END CATCH
    
    SELECT @Success AS Success, @Message AS Message;
END;
GO