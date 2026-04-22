<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/var/www/html/logs/php_errors.log');
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-User-ID"); // Permitimos el ID del usuario

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = "mysql-db";
$db   = "biblioteca_relacional";
$user = "root";
$pass = "admin";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexion en ms-libros"]);
    exit;
}

// CAPTURAMOS EL USUARIO QUE VIENE DEL GATEWAY (X-User-ID)
$current_user_id = isset($_SERVER['HTTP_X_USER_ID']) ? (int)$_SERVER['HTTP_X_USER_ID'] : null;

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$uriParts = explode('/', trim($requestUri, '/'));
$idFromUrl = end($uriParts);

switch ($method) {
    case 'GET':
        // Lógica Estilo GitHub:
        // Ver todos los públicos + mis propios privados
        if ($current_user_id) {
            $stmt = $pdo->prepare("SELECT * FROM libros WHERE visibilidad = 'publico' OR user_id = ?");
            $stmt->execute([$current_user_id]);
        } else {
            // Si no hay login, solo ver los públicos
            $stmt = $pdo->query("SELECT * FROM libros WHERE visibilidad = 'publico'");
        }
        echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !$current_user_id) { 
            http_response_code(401); 
            echo json_encode(["error" => "Debes estar logueado para subir libros a Piolín"]);
            exit; 
        }

        $stmt = $pdo->prepare("INSERT INTO libros (titulo, autor_id, genero, anio, portada_url, pdf_url, user_id, visibilidad, calificacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['titulo'], 
            $data['autor_id'], 
            $data['genero'] ?? null, 
            $data['anio'] ?? null,
            $data['portada_url'] ?? null,
            $data['pdf_url'] ?? null, // Nueva ruta del archivo PDF
            $current_user_id,         // Quién lo subió
            $data['visibilidad'] ?? 'publico',
            $data['calificacion'] ?? 0
        ]);
        echo json_encode(["status" => "Libro guardado en tu biblioteca", "id" => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        $id = is_numeric($idFromUrl) ? $idFromUrl : ($data['id'] ?? null);
        
        if (!$id || !$current_user_id) { 
            http_response_code(400); 
            echo json_encode(["error" => "Faltan datos o sesión"]);
            exit; 
        }

        // Seguridad: Solo el dueño puede editar su libro
        $stmtCheck = $pdo->prepare("SELECT user_id FROM libros WHERE id = ?");
        $stmtCheck->execute([$id]);
        $libro = $stmtCheck->fetch();

        if (!$libro || $libro['user_id'] != $current_user_id) {
            http_response_code(403);
            echo json_encode(["error" => "No tienes permiso para editar este libro"]);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE libros SET titulo = ?, autor_id = ?, genero = ?, anio = ?, portada_url = ?, pdf_url = ?, visibilidad = ?, calificacion = ? WHERE id = ?");
        $stmt->execute([
            $data['titulo'], 
            $data['autor_id'], 
            $data['genero'] ?? null, 
            $data['anio'] ?? null, 
            $data['portada_url'] ?? null,
            $data['pdf_url'] ?? $libro['pdf_url'],
            $data['visibilidad'] ?? 'publico',
            $data['calificacion'] ?? 0,
            $id
        ]);
        echo json_encode(["status" => "Cambios guardados correctamente"]);
        break;

    case 'DELETE':
        $id = is_numeric($idFromUrl) ? $idFromUrl : ($_GET['id'] ?? null);
        if (!$id || !$current_user_id) { http_response_code(400); exit; }

        // Seguridad: Solo el dueño puede borrar
        $stmtCheck = $pdo->prepare("SELECT user_id FROM libros WHERE id = ?");
        $stmtCheck->execute([$id]);
        $libro = $stmtCheck->fetch();

        if (!$libro || $libro['user_id'] != $current_user_id) {
            http_response_code(403);
            echo json_encode(["error" => "No puedes borrar libros de otros"]);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM libros WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["status" => "Libro eliminado de Piolín"]);
        break;

    default:
        http_response_code(405);
}