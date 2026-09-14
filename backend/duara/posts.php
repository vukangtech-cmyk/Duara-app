<?php
require_once 'config.php';
$data = json_input();
$user_id = (int)($data['user_id'] ?? 0);
$content = trim((string)($data['content'] ?? ''));
if ($user_id < 1 || $content === '' || mb_strlen($content) > 500) respond(['success'=>false,'message'=>'Post iwe na maandishi kati ya herufi 1 na 500.'], 422);
$check = $conn->prepare('SELECT id FROM users WHERE id = ?'); $check->bind_param('i', $user_id); $check->execute();
if (!$check->get_result()->fetch_assoc()) respond(['success'=>false,'message'=>'Mtumiaji hakupatikana.'], 404);
$stmt = $conn->prepare('INSERT INTO posts (user_id, content) VALUES (?, ?)'); $stmt->bind_param('is', $user_id, $content);
if (!$stmt->execute()) respond(['success'=>false,'message'=>'Post haikutumwa kwa sasa.'], 500);
respond(['success'=>true,'post'=>['id'=>$stmt->insert_id]]);
?>
