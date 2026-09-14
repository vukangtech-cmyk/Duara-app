<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
include "config.php";

$data = json_decode(file_get_contents("php://input"), true);

$name = $data['name'];
$phone = $data['phone'];
$pin_hash = password_hash($data['pin'], PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO users (name, phone, pin_hash) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $name, $phone, $pin_hash);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Umesajiliwa"]);
} else {
    echo json_encode(["success" => false, "message" => $stmt->error]);
}
?>