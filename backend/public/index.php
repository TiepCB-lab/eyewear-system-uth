<?php
header('Content-Type: application/json');

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
        return [
            'status' => 'skipped',
            'message' => 'Missing database env values.',
        ];
    }

    try {
        $adminDsn = 'mysql:host=' . $host . ';port=' . $port . ';charset=utf8mb4';
        $adminPdo = new PDO($adminDsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);

        $adminPdo->exec('CREATE DATABASE IF NOT EXISTS `' . str_replace('`', '``', $database) . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        $appDsn = 'mysql:host=' . $host . ';port=' . $port . ';dbname=' . $database . ';charset=utf8mb4';
        $appPdo = new PDO($appDsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);

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

        if ($existingCount === count($requiredTables)) {
            return [
                'status' => 'ready',
                'message' => 'Database already initialized.',
            ];
        }

        $schemaPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'schema.sql';
        $executed = execute_schema($appPdo, $schemaPath);

        return [
            'status' => 'initialized',
            'message' => 'Database initialized from schema.sql.',
            'statements_executed' => $executed,
        ];
    } catch (Throwable $e) {
        return [
            'status' => 'error',
            'message' => 'Database initialization failed: ' . $e->getMessage(),
        ];
    }
}

$dbInit = init_database();

echo json_content_response([
    "status" => "success",
    "message" => "Eyewear System UTH Backend API is live",
    "database_init" => $dbInit,
    "architecture" => "N-Layered PHP",
    "supported_v1_endpoints" => [
        "/auth",
        "/catalog",
        "/cart",
        "/checkout",
        "/ops"
    ]
]);

// Helper function mock
function json_content_response($data) {
    return json_encode([
        "data" => $data,
        "timestamp" => date("Y-m-d H:i:s")
    ], JSON_PRETTY_PRINT);
}
