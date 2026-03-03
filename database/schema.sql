-- =============================================
-- IT Inventory Management System Schema
-- =============================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ITInventoryDB')
BEGIN
    CREATE DATABASE ITInventoryDB;
END
GO

USE ITInventoryDB;
GO

-- ================================
-- Drop Tables If They Exist (Reverse Dependency Order)
-- ================================
IF OBJECT_ID('Asset_Log', 'U') IS NOT NULL DROP TABLE Asset_Log;
IF OBJECT_ID('Procurement_Request', 'U') IS NOT NULL DROP TABLE Procurement_Request;
IF OBJECT_ID('Maintenance_Request', 'U') IS NOT NULL DROP TABLE Maintenance_Request;
IF OBJECT_ID('Asset_Assignment', 'U') IS NOT NULL DROP TABLE Asset_Assignment;
IF OBJECT_ID('Assets', 'U') IS NOT NULL DROP TABLE Assets;
IF OBJECT_ID('Asset_Categories', 'U') IS NOT NULL DROP TABLE Asset_Categories;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
-- Drop old tables that might exist
IF OBJECT_ID('Transactions', 'U') IS NOT NULL DROP TABLE Transactions;
GO

-- ======================================================
-- 1. Users
-- ======================================================
CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('Admin', 'Asset Manager', 'Employee')),
    designation VARCHAR(100) NULL,
    department VARCHAR(100) NULL,
    location VARCHAR(100) NULL,
    joining_date DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Resigned', 'Suspended')),
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

-- Insert Default Admin User (admin@admin.com / admin123)
INSERT INTO Users (employee_code, full_name, email, password_hash, role)
VALUES ('ADMIN-001', 'System Administrator', 'admin@admin.com', '$2b$12$ZCrcLpZoTsj8gdhl5vtO1OP61m6LgxicfGZhqU1cUZkpj2htZujze', 'Admin');
GO

-- ======================================================
-- 2. Asset_Categories
-- ======================================================
CREATE TABLE Asset_Categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NULL
);
GO

-- ======================================================
-- 3. Assets
-- ======================================================
CREATE TABLE Assets (
    asset_id INT IDENTITY(1,1) PRIMARY KEY,
    asset_tag VARCHAR(50) UNIQUE NOT NULL,
    serial_number VARCHAR(120) NULL,
    category_id INT NOT NULL,
    brand VARCHAR(100) NULL,
    model VARCHAR(100) NULL,
    configuration VARCHAR(500) NULL,
    purchase_date DATE NULL,
    purchase_cost DECIMAL(18,2) NULL,
    depreciation_years INT NULL,
    current_value DECIMAL(18,2) NULL,
    warranty_expiry DATE NULL,
    location VARCHAR(100) NULL,
    condition_status VARCHAR(30) NOT NULL CHECK (condition_status IN ('New', 'Good', 'Fair', 'Damaged')),
    status VARCHAR(30) NOT NULL CHECK (status IN ('Available', 'Assigned', 'Maintenance', 'Retired')),
    last_audit_date DATE NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    
    CONSTRAINT FK_Assets_Category FOREIGN KEY (category_id) REFERENCES Asset_Categories(category_id)
);
GO

-- ======================================================
-- 4. Asset_Assignment
-- ======================================================
CREATE TABLE Asset_Assignment (
    assignment_id INT IDENTITY(1,1) PRIMARY KEY,
    asset_id INT NOT NULL,
    user_id INT NOT NULL,
    assigned_date DATE NOT NULL,
    expected_return_date DATE NULL,
    returned_date DATE NULL,
    approved_by INT NOT NULL,
    condition_at_issue VARCHAR(30) NULL,
    condition_at_return VARCHAR(30) NULL,
    confirmation_status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (confirmation_status IN ('Pending', 'Confirmed')),
    status VARCHAR(30) NOT NULL, -- e.g. Active, Completed
    remarks VARCHAR(500) NULL,

    CONSTRAINT FK_Assignment_Asset FOREIGN KEY (asset_id) REFERENCES Assets(asset_id),
    CONSTRAINT FK_Assignment_User FOREIGN KEY (user_id) REFERENCES Users(user_id),
    CONSTRAINT FK_Assignment_Approver FOREIGN KEY (approved_by) REFERENCES Users(user_id)
);
GO

-- ======================================================
-- 5. Maintenance_Request
-- ======================================================
CREATE TABLE Maintenance_Request (
    maintenance_id INT IDENTITY(1,1) PRIMARY KEY,
    asset_id INT NOT NULL,
    reported_by INT NOT NULL,
    issue_description VARCHAR(1000) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
    reported_date DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    resolved_date DATETIME2 NULL,
    remarks VARCHAR(500) NULL,

    CONSTRAINT FK_Maintenance_Asset FOREIGN KEY (asset_id) REFERENCES Assets(asset_id),
    CONSTRAINT FK_Maintenance_Reporter FOREIGN KEY (reported_by) REFERENCES Users(user_id)
);
GO

-- ======================================================
-- 6. Procurement_Request
-- ======================================================
CREATE TABLE Procurement_Request (
    request_id INT IDENTITY(1,1) PRIMARY KEY,
    category_id INT NOT NULL,
    requested_by INT NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(1000) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Ordered')),
    requested_date DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    approved_by INT NULL,
    approved_date DATETIME2 NULL,

    CONSTRAINT FK_Procurement_Category FOREIGN KEY (category_id) REFERENCES Asset_Categories(category_id),
    CONSTRAINT FK_Procurement_Requester FOREIGN KEY (requested_by) REFERENCES Users(user_id),
    CONSTRAINT FK_Procurement_Approver FOREIGN KEY (approved_by) REFERENCES Users(user_id)
);
GO

-- ======================================================
-- 7. Asset_Log (Audit Table)
-- ======================================================
CREATE TABLE Asset_Log (
    log_id INT IDENTITY(1,1) PRIMARY KEY,
    asset_id INT NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('Created', 'Assigned', 'Returned', 'Updated', 'Deleted', 'Maintenance')),
    performed_by INT NOT NULL,
    action_date DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    remarks VARCHAR(500) NULL,

    CONSTRAINT FK_Log_Asset FOREIGN KEY (asset_id) REFERENCES Assets(asset_id),
    CONSTRAINT FK_Log_Performer FOREIGN KEY (performed_by) REFERENCES Users(user_id)
);
GO

-- ======================================================
-- PERFORMANCE INDEXES
-- ======================================================
CREATE INDEX IX_Users_EmployeeCode ON Users(employee_code);
CREATE INDEX IX_Assets_Status ON Assets(status);
CREATE INDEX IX_Assets_Tag ON Assets(asset_tag);
CREATE INDEX IX_Assignment_Asset ON Asset_Assignment(asset_id);
CREATE INDEX IX_Assignment_User ON Asset_Assignment(user_id);
CREATE INDEX IX_Maintenance_Asset ON Maintenance_Request(asset_id);
CREATE INDEX IX_Log_Asset ON Asset_Log(asset_id);
GO