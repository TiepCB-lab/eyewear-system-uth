<?php

/**
 * M5 Integration Test: Creating a shipment and verifying order status update.
 *
 * Run:
 *   php tests/Feature/CreateShipmentTest.php
 */

define('APP_ROOT', dirname(__DIR__, 2));

function parseEnvFile(string $path): array
{
    $result = [];
    $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return [];
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0 || strpos($line, ';') === 0) {
            continue;
        }

        if (strpos($line, '=') === false) {
            continue;
        }

        [$name, $value] = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);

        if ($value !== '' && (($value[0] === '"' && substr($value, -1) === '"') || ($value[0] === "'" && substr($value, -1) === "'"))) {
            $value = substr($value, 1, -1);
        }

        $result[$name] = $value;
    }

    return $result;
}

function envValue(array $config, array $keys, $default = null)
{
    foreach ($keys as $key) {
        if (isset($config[$key]) && $config[$key] !== '') {
            return $config[$key];
        }
    }

    return $default;
}

function loadEnvConfig(): array
{
    $candidates = [
        APP_ROOT . DIRECTORY_SEPARATOR . '.env.local',
        APP_ROOT . DIRECTORY_SEPARATOR . '.env',
        dirname(APP_ROOT) . DIRECTORY_SEPARATOR . '.env',
    ];

    foreach ($candidates as $path) {
        if (is_file($path)) {
            return parseEnvFile($path);
        }
    }

    return [];
}

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function sendJsonPost(string $url, array $payload): array
{
    $body = json_encode($payload);
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n" .
                'Content-Length: ' . strlen((string) $body) . "\r\n",
            'content' => $body,
            'ignore_errors' => true,
            'timeout' => 15,
        ],
    ]);

    $responseBody = file_get_contents($url, false, $context);
    $headers = $http_response_header ?? [];
    $statusLine = $headers[0] ?? 'HTTP/1.1 500 Internal Server Error';

    preg_match('/\s(\d{3})\s/', $statusLine, $matches);
    $statusCode = isset($matches[1]) ? (int) $matches[1] : 500;

    $decoded = json_decode((string) $responseBody, true);

    return [
        'status' => $statusCode,
        'body' => is_array($decoded) ? $decoded : ['raw' => $responseBody],
    ];
}

function runTest(): void
{
    $config = loadEnvConfig();

    $host = envValue($config, ['DB_HOST', 'MYSQL_HOST'], '127.0.0.1');
    $port = envValue($config, ['DB_PORT', 'MYSQL_PORT'], '3306');
    $database = envValue($config, ['DB_DATABASE', 'MYSQL_DATABASE'], 'eyewear_system');
    $username = envValue($config, ['DB_USERNAME', 'MYSQL_USER'], 'root');
    $password = envValue($config, ['DB_PASSWORD', 'MYSQL_PASSWORD'], '');
    $apiBase = envValue($config, ['API_BASE_URL'], 'http://localhost:8000/api');

    $dsn = 'mysql:host=' . $host . ';port=' . $port . ';dbname=' . $database . ';charset=utf8mb4';
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $userId = (int) $pdo->query("SELECT id FROM `user` ORDER BY id ASC LIMIT 1")->fetchColumn();
    assertTrue($userId > 0, 'No user found to attach test order. Please run seeder first.');

    $orderNumber = 'M5-SHP-' . date('YmdHis') . '-' . random_int(100, 999);

    $insert = $pdo->prepare(
        "INSERT INTO `order` (user_id, order_number, total_amount, discount_amount, shipping_fee, status, shipping_address, billing_address, placed_at, production_step)
         VALUES (?, ?, 1200000, 0, 0, 'processing', 'M5 Shipment Test Shipping Address', 'M5 Shipment Test Billing Address', NOW(), 'packaging')"
    );
    $insert->execute([$userId, $orderNumber]);
    $orderId = (int) $pdo->lastInsertId();

    try {
        $tracking = 'M5TRK-' . strtoupper(substr(md5((string) microtime(true)), 0, 10));
        $payload = [
            'order_id' => $orderId,
            'courier' => 'GHN',
            'tracking_number' => $tracking,
            'shipping_status' => 'shipping',
        ];

        $response = sendJsonPost(rtrim($apiBase, '/') . '/v1/ops/shipments', $payload);

        assertTrue($response['status'] === 200, 'Expected HTTP 200, got ' . $response['status']);
        assertTrue(isset($response['body']['data']), 'Response missing data field.');

        $shipment = $response['body']['data'];
        assertTrue((int) ($shipment['order_id'] ?? 0) === $orderId, 'Shipment order_id mismatch.');
        assertTrue((string) ($shipment['shipping_status'] ?? '') === 'shipping', 'Shipping status should be shipping.');
        assertTrue((string) ($shipment['tracking_number'] ?? '') === $tracking, 'Tracking number mismatch.');

        $checkOrder = $pdo->prepare("SELECT status, production_step FROM `order` WHERE id = ? LIMIT 1");
        $checkOrder->execute([$orderId]);
        $order = $checkOrder->fetch();

        assertTrue((string) ($order['status'] ?? '') === 'shipped', 'Order status must be shipped after creating shipment.');
        assertTrue((string) ($order['production_step'] ?? '') === 'ready_to_ship', 'Order production_step must be ready_to_ship.');

        echo "PASS: shipment created and order {$orderId} moved to status shipped with step ready_to_ship.\n";
    } finally {
        $cleanupShipment = $pdo->prepare("DELETE FROM shipment WHERE order_id = ?");
        $cleanupShipment->execute([$orderId]);

        $cleanupOrder = $pdo->prepare("DELETE FROM `order` WHERE id = ?");
        $cleanupOrder->execute([$orderId]);
    }
}

try {
    runTest();
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, 'FAIL: ' . $e->getMessage() . "\n");
    exit(1);
}
