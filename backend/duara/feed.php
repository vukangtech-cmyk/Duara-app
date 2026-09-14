<?php
require_once 'config.php';
$result = $conn->query('SELECT posts.id, posts.content, posts.created_at, users.name, 0 AS likes FROM posts JOIN users ON users.id = posts.user_id ORDER BY posts.created_at DESC LIMIT 50');
$posts = [];
while ($row = $result->fetch_assoc()) { $posts[] = $row; }
respond(['success'=>true,'posts'=>$posts]);
?>
