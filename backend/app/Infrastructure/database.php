<?php

use Core\Database;

function create_database_connection(bool $createDatabase = false): PDO
{
    $config = load_env_config();

    $host = env_value($config, ['DB_HOST', 'MYSQL_HOST']);
    $port = env_value($config, ['DB_PORT', 'MYSQL_PORT'], '3306');
    $database = env_value($config, ['DB_DATABASE', 'MYSQL_DATABASE']);
    $username = env_value($config, ['DB_USERNAME', 'MYSQL_USER']);
    $password = env_value($config, ['DB_PASSWORD', 'MYSQL_PASSWORD'], '');

    if (!$host || !$database || !$username) {
        throw new RuntimeException('Missing database environment values.');
    }

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    if ($createDatabase) {
        $adminDsn = 'mysql:host=' . $host . ';port=' . $port . ';charset=utf8mb4';
        $adminPdo = new PDO($adminDsn, $username, $password, $options);
        $adminPdo->exec('CREATE DATABASE IF NOT EXISTS `' . str_replace('`', '``', $database) . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    }

    $dsn = 'mysql:host=' . $host . ';port=' . $port . ';dbname=' . $database . ';charset=utf8mb4';
    return new PDO($dsn, $username, $password, $options);
}

function connect_application_database(): PDO
{
    $pdo = create_database_connection(false);
    Database::setInstance($pdo);

    return $pdo;
}

function execute_schema(PDO $pdo, string $schemaPath): int
{
    $sql = file_get_contents($schemaPath);
    if ($sql === false) {
        throw new RuntimeException('Cannot read schema file.');
    }

    $sql = preg_replace('/^\xEF\xBB\xBF/', '', $sql);
    $sql = preg_replace('/^\s*CREATE\s+DATABASE[\s\S]*?;\s*/i', '', $sql, 1);
    $sql = preg_replace('/^\s*USE\s+[^;]+;\s*/i', '', $sql, 1);

    $statements = preg_split('/;\s*(?:\r?\n|$)/', $sql);
    $executed = 0;

    foreach ($statements as $statement) {
        $statement = trim($statement);
        if ($statement === '' || preg_match('/^--/', $statement)) {
            continue;
        }

        $pdo->exec($statement);
        $executed++;
    }

    return $executed;
}

function ensure_user_verification_schema(PDO $pdo, string $database): void
{
    $tableStmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = 'user'");
    $tableStmt->execute([$database]);
    $tableExists = (int) $tableStmt->fetchColumn() > 0;

    if (!$tableExists) {
        return;
    }

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = ? AND table_name = 'user' AND column_name = 'verify_token'");
    $stmt->execute([$database]);
    if ((int) $stmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE `user` ADD COLUMN verify_token VARCHAR(255) NULL AFTER password_hash");
    }
}

function initialize_application_database(): array
{
    $config = load_env_config();
    $database = env_value($config, ['DB_DATABASE', 'MYSQL_DATABASE']);
    if (!$database) {
        throw new RuntimeException('Missing database name.');
    }

    $pdo = create_database_connection(true);
    Database::setInstance($pdo);
    ensure_user_verification_schema($pdo, $database);

    $schemaPath = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'schema.sql';
    $executed = execute_schema($pdo, $schemaPath);

    return [
        'status' => 'initialized',
        'message' => 'Database initialized from schema.sql.',
        'statements_executed' => $executed,
    ];
}
