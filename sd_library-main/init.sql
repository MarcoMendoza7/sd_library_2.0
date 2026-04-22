DROP DATABASE IF EXISTS biblioteca_relacional;
CREATE DATABASE biblioteca_relacional CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE biblioteca_relacional;

-- 1. Nueva tabla de Usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Aquí guardaremos el hash
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Tabla de Libros actualizada (Estilo GitHub)
CREATE TABLE libros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor_id VARCHAR(50) NOT NULL,
    genero VARCHAR(100),
    anio INT,
    portada_url VARCHAR(500),
    pdf_url VARCHAR(500),      -- RUTA AL ARCHIVO PDF
    user_id INT,               -- DUEÑO DEL LIBRO (FK)
    visibilidad ENUM('publico', 'privado') DEFAULT 'publico',
    calificacion INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Datos de prueba (Admin inicial)
INSERT INTO usuarios (nombre, email, password) VALUES ('Admin Piolin', 'admin@piolin.com', '123456');