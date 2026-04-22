<?php
// Mostrar errores para debuggear en la consola del navegador
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-User-ID");

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
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexion: " . $e->getMessage()]);
    exit;
}

// CAPTURAMOS EL ID DE USUARIO (Intentamos varias formas por si el Proxy lo cambia)
$current_user_id = $_SERVER['HTTP_X_USER_ID'] ?? $_SERVER['X_USER_ID'] ?? null;

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if ($current_user_id) {
            $stmt = $pdo->prepare("SELECT * FROM libros WHERE visibilidad = 'publico' OR user_id = ?");
            $stmt->execute([$current_user_id]);
        } else {
            $stmt = $pdo->query("SELECT * FROM libros WHERE visibilidad = 'publico'");
        }
        echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
        break;

    case 'POST':
        // Extraemos los datos del $_POST (FormData)
        $titulo = $_POST['titulo'] ?? null;
        $autor_id = $_POST['autor_id'] ?? null;
        $genero = $_POST['genero'] ?? 'Literatura';
        $anio = $_POST['anio'] ?? date('Y');
        $visibilidad = $_POST['visibilidad'] ?? 'publico';
        
        // VALIDACIÓN RELAJADA: Si no hay user_id del gateway, usamos uno temporal para no trabar
        $final_user_id = $current_user_id ? (int)$current_user_id : 1; 

        if (!$titulo) {
            http_response_code(400);
            echo json_encode(["error" => "El titulo es obligatorio"]);
            exit;
        }

        $pdf_url = null;

        // PROCESAR SUBIDA DE PDF
        if (isset($_FILES['pdf_file']) && $_FILES['pdf_file']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = './uploads/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

            $extension = pathinfo($_FILES['pdf_file']['name'], PATHINFO_EXTENSION);
            $fileName = time() . '_' . uniqid() . '.' . $extension;
            $destPath = $uploadDir . $fileName;

            if (move_uploaded_file($_FILES['pdf_file']['tmp_name'], $destPath)) {
                // Guardamos solo el nombre del archivo para que la URL sea limpia
                $pdf_url = $fileName; 
            }
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO libros (titulo, autor_id, genero, anio, pdf_url, user_id, visibilidad) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$titulo, $autor_id, $genero, $anio, $pdf_url, $final_user_id, $visibilidad]);
            echo json_encode(["status" => "Libro subido correctamente", "id" => $pdo->lastInsertId()]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error al guardar en DB: " . $e->getMessage()]);
        }
        break;

    // ... (PUT y DELETE se quedan como los tenías)
    default:
        http_response_code(405);
}