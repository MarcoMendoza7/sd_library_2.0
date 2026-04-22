<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/var/www/html/logs/php_errors.log');
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-User-ID");

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

// CAPTURAMOS EL USUARIO QUE VIENE DEL GATEWAY
$current_user_id = isset($_SERVER['HTTP_X_USER_ID']) ? (int)$_SERVER['HTTP_X_USER_ID'] : null;

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$uriParts = explode('/', trim($requestUri, '/'));
$idFromUrl = end($uriParts);

switch ($method) {
    case 'GET':
        // Lógica de Visibilidad: Públicos de todos + Privados del usuario actual
        if ($current_user_id) {
            $stmt = $pdo->prepare("SELECT * FROM libros WHERE visibilidad = 'publico' OR user_id = ?");
            $stmt->execute([$current_user_id]);
        } else {
            $stmt = $pdo->query("SELECT * FROM libros WHERE visibilidad = 'publico'");
        }
        echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
        break;

    case 'POST':
        // Cuando subimos archivos, los datos vienen en $_POST, no en php://input
        $titulo = $_POST['titulo'] ?? null;
        $autor_id = $_POST['autor_id'] ?? null;
        $genero = $_POST['genero'] ?? null;
        $anio = $_POST['anio'] ?? null;
        $portada_url = $_POST['portada_url'] ?? null;
        $visibilidad = $_POST['visibilidad'] ?? 'publico';
        
        if (!$titulo || !$current_user_id) {
            http_response_code(400);
            echo json_encode(["error" => "Datos incompletos o sesión no iniciada"]);
            exit;
        }

        $pdf_url = null;

        // PROCESAR SUBIDA DE PDF
        if (isset($_FILES['pdf_file']) && $_FILES['pdf_file']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = './uploads/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

            $fileName = time() . '_' . preg_replace("/[^a-zA-Z0-9.]/", "_", $_FILES['pdf_file']['name']);
            $destPath = $uploadDir . $fileName;

            if (move_uploaded_file($_FILES['pdf_file']['tmp_name'], $destPath)) {
                $pdf_url = $destPath;
            }
        }

        $stmt = $pdo->prepare("INSERT INTO libros (titulo, autor_id, genero, anio, portada_url, pdf_url, user_id, visibilidad) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$titulo, $autor_id, $genero, $anio, $portada_url, $pdf_url, $current_user_id, $visibilidad]);
        
        echo json_encode(["status" => "Libro subido correctamente a Piolín", "id" => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        // Para PUT con archivos es más complejo, usaremos JSON para actualización de datos básicos
        $data = json_decode(file_get_contents("php://input"), true);
        $id = is_numeric($idFromUrl) ? $idFromUrl : ($data['id'] ?? null);
        
        if (!$id || !$current_user_id) {
            http_response_code(400);
            echo json_encode(["error" => "ID o sesión faltante"]);
            exit;
        }

        // Verificar propiedad
        $stmtCheck = $pdo->prepare("SELECT user_id FROM libros WHERE id = ?");
        $stmtCheck->execute([$id]);
        $libro = $stmtCheck->fetch();

        if (!$libro || $libro['user_id'] != $current_user_id) {
            http_response_code(403);
            echo json_encode(["error" => "No tienes permiso sobre este libro"]);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE libros SET titulo = ?, genero = ?, anio = ?, visibilidad = ? WHERE id = ?");
        $stmt->execute([
            $data['titulo'], 
            $data['genero'] ?? null, 
            $data['anio'] ?? null, 
            $data['visibilidad'] ?? 'publico',
            $id
        ]);
        echo json_encode(["status" => "Libro actualizado"]);
        break;

    case 'DELETE':
        $id = is_numeric($idFromUrl) ? $idFromUrl : ($_GET['id'] ?? null);
        if (!$id || !$current_user_id) {
            http_response_code(400);
            exit;
        }

        // Verificar propiedad antes de borrar
        $stmtCheck = $pdo->prepare("SELECT user_id, pdf_url FROM libros WHERE id = ?");
        $stmtCheck->execute([$id]);
        $libro = $stmtCheck->fetch();

        if ($libro && $libro['user_id'] == $current_user_id) {
            // Borrar el archivo físico si existe
            if ($libro['pdf_url'] && file_exists($libro['pdf_url'])) {
                unlink($libro['pdf_url']);
            }
            
            $stmt = $pdo->prepare("DELETE FROM libros WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["status" => "Libro eliminado físicamente"]);
        } else {
            http_response_code(403);
            echo json_encode(["error" => "No autorizado"]);
        }
        break;

    default:
        http_response_code(405);
}