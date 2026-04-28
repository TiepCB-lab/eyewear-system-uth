<?php
$dsn = 'mysql:host=127.0.0.1;port=3306;dbname=eyewear_system;charset=utf8mb4';
$username = 'root';
$password = '';

try {
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    $sql = file_get_contents('schema.sql');
    $pdo->exec($sql);
    echo "Schema executed successfully.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
