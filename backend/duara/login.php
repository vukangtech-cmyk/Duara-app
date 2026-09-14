<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");
include "config.php";

// ... code nyingine inaendelea kama kawaida
$data = json_decode(file_get_contents("php://input"), true);
$phone = $data['phone'];
$pin = $data['pin'];

$stmt = $conn->prepare("SELECT id, name, pin_hash FROM users WHERE phone = ?");
$stmt->bind_param("s", $phone);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if ($user && password_verify($pin, $user['pin_hash'])) {
    echo json_encode(["success" => true, "user" => ["id" => $user['id'], "name" => $user['name']]]);
} else {
    echo json_encode(["success" => false, "message" => "Simu au PIN si sahihi"]);
}
?>