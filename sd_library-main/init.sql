DROP DATABASE IF EXISTS biblioteca_relacional;
CREATE DATABASE biblioteca_relacional
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE biblioteca_relacional;

CREATE TABLE libros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor_id VARCHAR(50) NOT NULL,
    genero VARCHAR(100),
    anio INT,
    portada_url VARCHAR(500),
    calificacion INT DEFAULT 0,
    contenido LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO libros (titulo, autor_id, genero, anio, portada_url, calificacion, contenido) VALUES 
('Cien años de soledad', '1', 'Realismo mágico', 1967, 'https://images.penguinrandomhouse.com/cover/9780307474728', 5, 'Muchos años después, frente al pelotón de fusilamiento, el coronel Aureliano Buendía había de recordar aquella tarde remota en que su padre lo llevó a conocer el hielo. Macondo era entonces una aldea de veinte casas de barro y cañabrava construidas a la orilla de un río de aguas diáfanas que se precipitaban por un lecho de piedras pulidas, blancas y enormes como huevos prehistóricos...'),
('El amor en los tiempos del cólera', '1', 'Novela', 1985, 'https://images.penguinrandomhouse.com/cover/9780307389732', 5, NULL),
('Pedro Páramo', '2', 'Novela', 1955, 'https://m.media-amazon.com/images/I/71oD41wP07L._AC_UF1000,1000_QL80_.jpg', 4, NULL),
('El llano en llamas', '2', 'Cuento', 1953, 'https://m.media-amazon.com/images/I/81xHhXjJLLL._AC_UF1000,1000_QL80_.jpg', 4, NULL),
('La ciudad y los perros', '3', 'Novela', 1963, 'https://m.media-amazon.com/images/I/71Yy3+h8HIL._AC_UF1000,1000_QL80_.jpg', 4, NULL),
('Conversación en La Catedral', '3', 'Ficción', 1969, 'https://m.media-amazon.com/images/I/71H26bQ6SFL._AC_UF1000,1000_QL80_.jpg', 5, NULL),
('Rayuela', '4', 'Novela', 1963, 'https://images.cdn2.buscalibre.com/fit-in/360x360/cb/09/cb09db8b4bd75d4fcf78ef181829e925.jpg', 5, NULL);