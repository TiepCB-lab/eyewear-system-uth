<?php

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

define('APP_ROOT', dirname(__DIR__));

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

function env_value(array $config, array $keys, $default = null) {
    foreach ($keys as $key) {
        if (isset($config[$key]) && $config[$key] !== '') {
            return $config[$key];
        }
    }
    return $default;
}

function load_env_config() {
    $backendRoot = dirname(__DIR__);
    $workspaceRoot = dirname($backendRoot);
    $candidates = [
        $backendRoot . DIRECTORY_SEPARATOR . '.env',
        $workspaceRoot . DIRECTORY_SEPARATOR . '.env',
    ];

    foreach ($candidates as $path) {
        if (is_file($path)) {
            $config = parse_ini_file($path, false, INI_SCANNER_RAW);
            if (is_array($config)) {
                return $config;
            }
        }
    }
    return [];
}

function execute_schema(PDO $pdo, $schemaPath) {
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

function init_database() {
    $config = load_env_config();

    $host = env_value($config, ['DB_HOST', 'MYSQL_HOST']);
    $port = env_value($config, ['DB_PORT', 'MYSQL_PORT'], '3306');
    $database = env_value($config, ['DB_DATABASE', 'MYSQL_DATABASE']);
    $username = env_value($config, ['DB_USERNAME', 'MYSQL_USER']);
    $password = env_value($config, ['DB_PASSWORD', 'MYSQL_PASSWORD'], '');

    if (!$host || !$database || !$username) {
        return ['status' => 'skipped', 'message' => 'Missing database env values.'];
    }

    try {
        $adminDsn = 'mysql:host=' . $host . ';port=' . $port . ';charset=utf8mb4';
        $adminPdo = new PDO($adminDsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);

        $adminPdo->exec('CREATE DATABASE IF NOT EXISTS `' . str_replace('`', '``', $database) . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        $appDsn = 'mysql:host=' . $host . ';port=' . $port . ';dbname=' . $database . ';charset=utf8mb4';
        $appPdo = new PDO($appDsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);

        \Core\Database::setInstance($appPdo);

        $requiredTables = [
            'role', 'user', 'product', 'productvariant', 'inventory', 'lens',
            'promotion', 'prescription', 'cart', 'cartitem', 'order', 'orderitem',
            'payment', 'shipment', 'supportticket', 'returnrequest',
        ];

        $placeholders = implode(',', array_fill(0, count($requiredTables), '?'));
        $checkStmt = $appPdo->prepare(
            'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name IN (' . $placeholders . ')'
        );
        $checkStmt->execute(array_merge([$database], $requiredTables));
        $existingCount = (int) $checkStmt->fetchColumn();

        $schemaPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'schema.sql';

        if ($existingCount === count($requiredTables)) {
            return ['status' => 'ready', 'message' => 'Database already initialized.'];
        }

        $executed = execute_schema($appPdo, $schemaPath);
        return ['status' => 'initialized', 'message' => 'Database initialized from schema.sql.', 'statements_executed' => $executed];
    } catch (Throwable $e) {
        return ['status' => 'error', 'message' => 'Database initialization failed: ' . $e->getMessage()];
    }
}

// 1. Init Database (Also registers PDO in Core\Database)
$dbInit = init_database();

// 2. Load API Routes
require_once APP_ROOT . DIRECTORY_SEPARATOR . 'routes' . DIRECTORY_SEPARATOR . 'api.php';

// 3. Dispatch current request
\Core\Router::dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
