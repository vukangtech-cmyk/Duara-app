<?php
require_once 'config.php';
$data = json_input();
$phone = preg_replace('/\s+/', '', (string)($data['phone'] ?? ''));
$pin = (string)($data['pin'] ?? '');
if (!preg_match('/^\+?[0-9]{9,15}$/', $phone) || !preg_match('/^[0-9]{4,6}$/', $pin)) respond(['success'=>false,'message'=>'Simu au PIN si sahihi.'], 422);
$stmt = $conn->prepare('SELECT id, name, pin_hash FROM users WHERE phone = ? LIMIT 1');
$stmt->bind_param('s', $phone); $stmt->execute(); $result = $stmt->get_result(); $user = $result->fetch_assoc();
if ($user && password_verify($pin, $user['pin_hash'])) respond(['success'=>true,'user'=>['id'=>(int)$user['id'],'name'=>$user['name']]]);
respond(['success'=>false,'message'=>'Simu au PIN si sahihi.'], 401);
?>
