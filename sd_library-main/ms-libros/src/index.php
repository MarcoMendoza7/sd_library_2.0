<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/var/www/html/logs/php_errors.log');
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

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
    echo json_encode(["error" => "Error de conexion"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$uriParts = explode('/', trim($requestUri, '/'));
$idFromUrl = end($uriParts);

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM libros");
        echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) { http_response_code(400); exit; }
        $stmt = $pdo->prepare("INSERT INTO libros (titulo, autor_id, genero, anio, portada_url, calificacion, contenido) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['titulo'], 
            $data['autor_id'], 
            $data['genero'] ?? null, 
            $data['anio'] ?? null,
            $data['portada_url'] ?? null,
            $data['calificacion'] ?? 0,
            $data['contenido'] ?? null
        ]);
        echo json_encode(["status" => "Libro agregado"]);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        $requestUri = $_SERVER['REQUEST_URI'];
        $uriParts = explode('/', trim($requestUri, '/'));
        $idFromUrl = end($uriParts);
        $id = is_numeric($idFromUrl) ? $idFromUrl : ($data['id'] ?? null);
        if (!$id || !$data) { 
            http_response_code(400); 
            echo json_encode(["error" => "ID o datos no proporcionados"]);
            exit; 
        }
        $stmt = $pdo->prepare("UPDATE libros SET titulo = ?, autor_id = ?, genero = ?, anio = ?, portada_url = ?, calificacion = ?, contenido = ? WHERE id = ?");
        $stmt->execute([
            $data['titulo'], 
            $data['autor_id'], 
            $data['genero'] ?? null, 
            $data['anio'] ?? null, 
            $data['portada_url'] ?? null,
            $data['calificacion'] ?? 0,
            $data['contenido'] ?? null,
            $id
        ]);
        echo json_encode(["status" => "Libro actualizado correctamente"]);
        break;

    case 'DELETE':
        $id = is_numeric($idFromUrl) ? $idFromUrl : ($_GET['id'] ?? null);
        if (!$id) { http_response_code(400); exit; }
        $stmt = $pdo->prepare("DELETE FROM libros WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["status" => "Libro eliminado"]);
        break;

    default:
        http_response_code(405);
}