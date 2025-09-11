USE AdventureWorks2022;
GO

-- 1. CRUD para Person.Person
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'uspPersonasGetAll')
    DROP PROCEDURE uspPersonasGetAll;
GO

CREATE PROCEDURE uspPersonasGetAll
AS
BEGIN
    SELECT 
        BusinessEntityID,
        PersonType,
        NameStyle,
        Title,
        FirstName,
        MiddleName,
        LastName,
        Suffix,
        EmailPromotion,
        ModifiedDate
    FROM Person.Person
    ORDER BY LastName, FirstName;
END;
GO

-- 2. Obtener persona por ID
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'uspPersonasGetById')
    DROP PROCEDURE uspPersonasGetById;
GO

CREATE PROCEDURE uspPersonasGetById
    @BusinessEntityID INT
AS
BEGIN
    SELECT 
        BusinessEntityID,
        PersonType,
        NameStyle,
        Title,
        FirstName,
        MiddleName,
        LastName,
        Suffix,
        EmailPromotion,
        ModifiedDate
    FROM Person.Person 
    WHERE BusinessEntityID = @BusinessEntityID;
END;
GO

-- 3. CRUD para Sales.SalesOrderHeader
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'uspOrdenesVentaGetAll')
    DROP PROCEDURE uspOrdenesVentaGetAll;
GO

CREATE PROCEDURE uspOrdenesVentaGetAll
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
        PurchaseOrderNumber,
        AccountNumber,
        CustomerID,
        SalesPersonID,
        TerritoryID,
        BillToAddressID,
        ShipToAddressID,
        ShipMethodID,
        CreditCardID,
        CreditCardApprovalCode,
        CurrencyRateID,
        SubTotal,
        TaxAmt,
        Freight,
        TotalDue,
        Comment,
        ModifiedDate
    FROM Sales.SalesOrderHeader
    ORDER BY OrderDate DESC;
END;
GO

-- 4. Obtener orden de venta por ID
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'uspOrdenesVentaGetById')
    DROP PROCEDURE uspOrdenesVentaGetById;
GO

CREATE PROCEDURE uspOrdenesVentaGetById
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
        PurchaseOrderNumber,
        AccountNumber,
        CustomerID,
        SalesPersonID,
        TerritoryID,
        BillToAddressID,
        ShipToAddressID,
        ShipMethodID,
        CreditCardID,
        CreditCardApprovalCode,
        CurrencyRateID,
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