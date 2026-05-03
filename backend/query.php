<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=eyewear_system', 'root', '');
$stmt = $pdo->query("SHOW CREATE TABLE `order`");
print_r($stmt->fetch(PDO::FETCH_ASSOC));
