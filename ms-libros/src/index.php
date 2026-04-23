<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-User-ID");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

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
    echo json_encode(["error" => "Error DB"]); exit;
}

$current_user_id = (isset($_SERVER['HTTP_X_USER_ID']) && $_SERVER['HTTP_X_USER_ID'] != '0') ? (int)$_SERVER['HTTP_X_USER_ID'] : null;
$method = $_SERVER['REQUEST_METHOD'];

// Capturar ID del recurso de la URL
$path_parts = explode('/', $_SERVER['REQUEST_URI']);
$resource_id = is_numeric(end($path_parts)) ? (int)end($path_parts) : null;

// Detectar si es una actualización simulada por FormData
if ($method === 'POST' && isset($_POST['_method']) && $_POST['_method'] === 'PUT') {
    $method = 'PUT';
}

switch ($method) {
    case 'GET':
        $stmt = $current_user_id 
            ? $pdo->prepare("SELECT * FROM libros WHERE visibilidad = 'publico' OR user_id = ?") 
            : $pdo->prepare("SELECT * FROM libros WHERE visibilidad = 'publico'");
        $current_user_id ? $stmt->execute([$current_user_id]) : $stmt->execute();
        $libros = $stmt->fetchAll();
        foreach ($libros as &$l) { $l['puedo_leer'] = ($current_user_id !== null); }
        echo json_encode($libros);
        break;

    case 'POST':
        if (!$current_user_id) { http_response_code(403); exit; }
        $pdf_url = null;
        if (isset($_FILES['pdf_file'])) {
            $name = time() . "_" . $_FILES['pdf_file']['name'];
            move_uploaded_file($_FILES['pdf_file']['tmp_name'], "./uploads/" . $name);
            $pdf_url = $name;
        }
        $stmt = $pdo->prepare("INSERT INTO libros (titulo, autor_id, genero, anio, pdf_url, user_id, visibilidad) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$_POST['titulo'], $_POST['autor'], $_POST['genero'], $_POST['anio'], $pdf_url, $current_user_id, $_POST['visibilidad']]);
        echo json_encode(["status" => "ok"]);
        break;

    case 'PUT':
        if (!$current_user_id || !$resource_id) { http_response_code(400); exit; }
        
        $check = $pdo->prepare("SELECT user_id, pdf_url FROM libros WHERE id = ?");
        $check->execute([$resource_id]);
        $libro = $check->fetch();

        if ($libro['user_id'] != $current_user_id) { http_response_code(403); exit; }

        $pdf_url = $libro['pdf_url']; // Mantener el actual por defecto

        // Si se subió un nuevo archivo PDF
        if (isset($_FILES['pdf_file']) && $_FILES['pdf_file']['error'] === UPLOAD_ERR_OK) {
            if ($libro['pdf_url']) { @unlink("./uploads/" . $libro['pdf_url']); } // Borrar viejo
            $name = time() . "_" . $_FILES['pdf_file']['name'];
            move_uploaded_file($_FILES['pdf_file']['tmp_name'], "./uploads/" . $name);
            $pdf_url = $name;
        }

        $stmt = $pdo->prepare("UPDATE libros SET titulo=?, autor_id=?, genero=?, anio=?, visibilidad=?, pdf_url=? WHERE id=?");
        $stmt->execute([$_POST['titulo'], $_POST['autor'], $_POST['genero'], $_POST['anio'], $_POST['visibilidad'], $pdf_url, $resource_id]);
        echo json_encode(["status" => "updated"]);
        break;

    case 'DELETE':
        if (!$current_user_id || !$resource_id) { http_response_code(400); exit; }
        $check = $pdo->prepare("SELECT user_id, pdf_url FROM libros WHERE id = ?");
        $check->execute([$resource_id]);
        $libro = $check->fetch();
        if ($libro['user_id'] != $current_user_id) { http_response_code(403); exit; }

        if ($libro['pdf_url']) { @unlink("./uploads/" . $libro['pdf_url']); }
        $pdo->prepare("DELETE FROM libros WHERE id = ?")->execute([$resource_id]);
        echo json_encode(["status" => "deleted"]);
        break;
}