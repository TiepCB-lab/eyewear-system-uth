<?php
/**
 * Database Reset & Initialization Script
 * 
 * WARNING: This script will DROP the existing database and recreate it.
 * All data will be lost.
 */

define('APP_ROOT', dirname(__DIR__));

// Helper to load .env
function load_env_for_reset() {
    $envPath = APP_ROOT . DIRECTORY_SEPARATOR . '.env';
    if (!file_exists($envPath)) {
        die("Error: .env file not found at $envPath\n");
    }

    $config = [];
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $config[trim($parts[0])] = trim($parts[1], " \t\n\r\0\x0B\"'");
        }
    }
    return $config;
}

$config = load_env_for_reset();

$host = $config['DB_HOST'] ?? '127.0.0.1';
$port = $config['DB_PORT'] ?? '3306';
$dbName = $config['DB_DATABASE'] ?? 'eyewear_system';
$user = $config['DB_USERNAME'] ?? 'root';
$pass = $config['DB_PASSWORD'] ?? '';

try {
    echo "Connecting to MySQL at $host...\n";
    $pdo = new PDO("mysql:host=$host;port=$port", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    echo "Dropping database `$dbName` (if exists)...\n";
    $pdo->exec("DROP DATABASE IF EXISTS `$dbName` ");

    echo "Creating database `$dbName`...\n";
    $pdo->exec("CREATE DATABASE `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbName` ");

    echo "Running schema.sql...\n";
    $schemaSql = file_get_contents(__DIR__ . '/schema.sql');
    if (!$schemaSql) die("Error: schema.sql not found.\n");
    
    // Using a more robust way to execute multi-statement SQL
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, 0);
    $pdo->exec($schemaSql);
    echo "Schema imported successfully.\n";

    echo "Running seeder.php...\n";
    $phpPath = PHP_BINARY ?: 'php';
    $seederPath = __DIR__ . '/seeder.php';
    $output = shell_exec("\"$phpPath\" \"$seederPath\"");
    echo "Seeder output:\n$output\n";

    echo "\n--- DATABASE RESET COMPLETE ---\n";

} catch (PDOException $e) {
    echo "\nFATAL ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
