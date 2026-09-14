<?php
declare(strict_types=1);

header("Access-Control-Allow-Origin: " . (getenv('DUARA_FRONTEND_ORIGIN') ?: 'http://localhost:5173'));
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

mysqli_report(MYSQLI_REPORT_OFF);
$host = getenv('DUARA_DB_HOST') ?: 'localhost';
$user = getenv('DUARA_DB_USER') ?: 'duara_user';
$password = getenv('DUARA_DB_PASSWORD') ?: '';
$dbname = getenv('DUARA_DB_NAME') ?: 'duara_db';
$conn = new mysqli($host, $user, $password, $dbname);
$conn->set_charset('utf8mb4');
if ($conn->connect_error) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Huduma ya database haipatikani kwa sasa.']);
    exit;
}
function json_input(): array {
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}
function respond(array $payload, int $status = 200): never {
    http_response_code($status); header('Content-Type: application/json'); echo json_encode($payload); exit;
}
?>
