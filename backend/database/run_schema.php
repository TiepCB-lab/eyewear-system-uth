<?php

define('APP_ROOT', dirname(__DIR__));

if (!function_exists('str_starts_with')) {
    function str_starts_with(string $haystack, string $needle): bool
    {
        return $needle === '' || strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}

spl_autoload_register(function ($class) {
    if (str_starts_with($class, 'App\\')) {
        $file = APP_ROOT . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . str_replace('\\', DIRECTORY_SEPARATOR, substr($class, 4)) . '.php';
    } elseif (str_starts_with($class, 'Core\\')) {
        $file = APP_ROOT . DIRECTORY_SEPARATOR . 'core' . DIRECTORY_SEPARATOR . str_replace('\\', DIRECTORY_SEPARATOR, substr($class, 5)) . '.php';
    } else {
        return;
    }

    if (file_exists($file)) {
        require_once $file;
    }
});

require_once APP_ROOT . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'Infrastructure' . DIRECTORY_SEPARATOR . 'env.php';

echo "--- Eyewear System Database Initialization ---\n";

try {
    $config = load_env_config();
    $host = env_value($config, ['DB_HOST', 'MYSQL_HOST'], '127.0.0.1');
    $port = env_value($config, ['DB_PORT', 'MYSQL_PORT'], '3306');
    $dbName = env_value($config, ['DB_DATABASE', 'MYSQL_DATABASE'], 'eyewear_system');
    $user = env_value($config, ['DB_USERNAME', 'MYSQL_USER'], 'root');
    $pass = env_value($config, ['DB_PASSWORD', 'MYSQL_PASSWORD'], '');

    echo "Connecting to MySQL at $host:$port...\n";
    $pdo = new PDO("mysql:host=$host;port=$port", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    echo "Dropping database `$dbName` (if exists)...\n";
    $pdo->exec("DROP DATABASE IF EXISTS `$dbName` ");

    echo "Creating database `$dbName`...\n";
    $pdo->exec("CREATE DATABASE `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbName` ");

    echo "Importing schema.sql...\n";
    $schemaPath = __DIR__ . DIRECTORY_SEPARATOR . 'schema.sql';
    $sql = file_get_contents($schemaPath);
    if ($sql === false) {
        throw new RuntimeException("Cannot read schema file at $schemaPath");
    }

    // Execute multi-statement SQL
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, 0);
    $pdo->exec($sql);
    echo "Schema imported successfully.\n";

    echo "Running seeder.php...\n";
    $seederPath = __DIR__ . DIRECTORY_SEPARATOR . 'seeder.php';
    if (file_exists($seederPath)) {
        $phpPath = PHP_BINARY ?: 'php';
        // Run seeder in a separate process to avoid conflicts
        $command = "\"$phpPath\" \"$seederPath\"";
        $output = shell_exec($command);
        echo "Seeder output:\n$output\n";
    } else {
        echo "Warning: seeder.php not found.\n";
    }

    echo "\n--- DATABASE INITIALIZATION COMPLETE ---\n";

} catch (Throwable $e) {
    fwrite(STDERR, "\nFATAL ERROR: " . $e->getMessage() . "\n");
    exit(1);
}
