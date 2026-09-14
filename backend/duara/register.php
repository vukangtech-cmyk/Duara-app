<?php
require_once 'config.php';
$data = json_input();
$name = trim((string)($data['name'] ?? ''));
$phone = preg_replace('/\s+/', '', (string)($data['phone'] ?? ''));
$pin = (string)($data['pin'] ?? '');
if ($name === '' || mb_strlen($name) < 2 || mb_strlen($name) > 80) respond(['success'=>false,'message'=>'Jina liwe kati ya herufi 2 na 80.'], 422);
if (!preg_match('/^\+?[0-9]{9,15}$/', $phone)) respond(['success'=>false,'message'=>'Namba ya simu si sahihi.'], 422);
if (!preg_match('/^[0-9]{4,6}$/', $pin)) respond(['success'=>false,'message'=>'PIN iwe na tarakimu 4 hadi 6.'], 422);
$pin_hash = password_hash($pin, PASSWORD_DEFAULT);
$stmt = $conn->prepare('INSERT INTO users (name, phone, pin_hash) VALUES (?, ?, ?)');
$stmt->bind_param('sss', $name, $phone, $pin_hash);
if ($stmt->execute()) respond(['success'=>true,'message'=>'Umesajiliwa']);
if ($conn->errno === 1062) respond(['success'=>false,'message'=>'Namba hii tayari imesajiliwa.'], 409);
respond(['success'=>false,'message'=>'Usajili umeshindikana kwa sasa.'], 500);
?>
