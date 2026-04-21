<?php

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

define('APP_ROOT', dirname(__DIR__));

if (!function_exists('str_starts_with')) {
    function str_starts_with(string $haystack, string $needle): bool
    {
        return $needle === '' || strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}

if (!function_exists('str_ends_with')) {
    function str_ends_with(string $haystack, string $needle): bool
    {
        return $needle === '' || substr_compare($haystack, $needle, -strlen($needle)) === 0;
    }
}

if (!function_exists('str_contains')) {
    function str_contains(string $haystack, string $needle): bool
    {
        return $needle === '' || strpos($haystack, $needle) !== false;
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

function ensure_user_verification_schema(PDO $pdo, string $database): void {
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
        ensure_user_verification_schema($appPdo, $database);
        $requiredTables = [
            'role', 'user', 'user_roles', 'profiles', 'password_reset_tokens', 'product', 'productvariant', 'inventory', 'lens',
            'system_config', 'promotion', 'prescription', 'cart', 'cartitem', 'order', 'orderitem',
            'payment', 'shipment', 'supportticket', 'ticket_replies', 'returnrequest',
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
if ($dbInit['status'] !== 'ready' && $dbInit['status'] !== 'initialized') {
    http_response_code(500);
    echo json_encode([
        'message' => 'Server error',
        'error' => $dbInit['message'] ?? 'Database initialization failed.',
        'status' => $dbInit['status'] ?? 'unknown',
    ]);
    exit;
}

// 2. Load API Routes
require_once APP_ROOT . DIRECTORY_SEPARATOR . 'routes' . DIRECTORY_SEPARATOR . 'api.php';

// 3. Dispatch current request
try {
    \Core\Router::dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'message' => 'Server error',
        'error' => $e->getMessage(),
    ]);
}
