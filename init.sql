-- Creación de base de datos y tablas
CREATE DATABASE IF NOT EXISTS nomina_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE nomina_db;

-- Tabla de empleados
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    edad INT NOT NULL CHECK (edad >= 18 AND edad <= 100),
    sexo ENUM('M', 'F', 'Masculino', 'Femenino', 'Otro') NOT NULL,
    cargo VARCHAR(255) NOT NULL,
    sueldo DECIMAL(12, 2) NOT NULL CHECK (sueldo >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre),
    INDEX idx_cargo (cargo),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de datos importados (auditoría)
CREATE TABLE IF NOT EXISTS data_imported (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(500) NOT NULL,
    sheet_name VARCHAR(255) NOT NULL,
    total_records INT NOT NULL DEFAULT 0,
    successful_records INT NOT NULL DEFAULT 0,
    failed_records INT NOT NULL DEFAULT 0,
    import_status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    user_info JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_filename (filename),
    INDEX idx_status (import_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de errores de importación
CREATE TABLE IF NOT EXISTS data_errors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    import_id INT,
    sheet_name VARCHAR(255) NOT NULL,
    row_number INT NOT NULL,
    column_name VARCHAR(255),
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    row_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (import_id) REFERENCES data_imported(id) ON DELETE CASCADE,
    INDEX idx_import_id (import_id),
    INDEX idx_sheet_name (sheet_name),
    INDEX idx_error_type (error_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar datos de ejemplo
INSERT INTO employees (nombre, edad, sexo, cargo, sueldo) VALUES
('Juan Pérez', 35, 'M', 'Desarrollador Senior', 4500.00),
('María García', 28, 'F', 'Analista de Datos', 3800.00),
('Carlos Rodríguez', 42, 'M', 'Gerente de Proyectos', 6500.00),
('Ana Martínez', 31, 'F', 'Diseñadora UX/UI', 4000.00),
('Luis Hernández', 45, 'M', 'Director de Tecnología', 8500.00),
('Laura López', 26, 'F', 'Desarrolladora Junior', 2800.00),
('Pedro Sánchez', 38, 'M', 'Arquitecto de Software', 7000.00),
('Carmen Díaz', 33, 'F', 'Product Owner', 5500.00);

-- Crear usuario con privilegios limitados (ya creado por MySQL, solo permisos)
GRANT SELECT, INSERT, UPDATE, DELETE ON nomina_db.* TO 'nomina_user'@'%';
FLUSH PRIVILEGES;