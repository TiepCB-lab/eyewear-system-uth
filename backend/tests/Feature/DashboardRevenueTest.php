<?php

/**
 * M5 Integration Test: Analytics revenue must match paid invoices.
 *
 * Run:
 *   php tests/Feature/DashboardRevenueTest.php
 */

function appRootPath(): string
{
    return dirname(__DIR__, 2);
}

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
        appRootPath() . DIRECTORY_SEPARATOR . '.env.local',
        appRootPath() . DIRECTORY_SEPARATOR . '.env',
        dirname(appRootPath()) . DIRECTORY_SEPARATOR . '.env',
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

function captureDashboardResponse(): array
{
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['REQUEST_URI'] = '/api/v1/dashboard';

    ob_start();
    $previousErrorReporting = error_reporting(0);
    @include appRootPath() . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'index.php';
    error_reporting($previousErrorReporting);
    $responseBody = ob_get_clean();

    $decoded = json_decode((string) $responseBody, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Invalid JSON response from dashboard bootstrap.');
    }

    return $decoded;
}

function runTest(): void
{
    $config = loadEnvConfig();

    $host = envValue($config, ['DB_HOST', 'MYSQL_HOST'], '127.0.0.1');
    $port = envValue($config, ['DB_PORT', 'MYSQL_PORT'], '3306');
    $database = envValue($config, ['DB_DATABASE', 'MYSQL_DATABASE'], 'eyewear_system');
    $username = envValue($config, ['DB_USERNAME', 'MYSQL_USER'], 'root');
    $password = envValue($config, ['DB_PASSWORD', 'MYSQL_PASSWORD'], '');
    $dsn = 'mysql:host=' . $host . ';port=' . $port . ';dbname=' . $database . ';charset=utf8mb4';
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $userId = (int) $pdo->query("SELECT id FROM `user` ORDER BY id ASC LIMIT 1")->fetchColumn();
    assertTrue($userId > 0, 'No user found to attach test order. Please run seeder first.');

    $productVariantId = (int) $pdo->query("SELECT id FROM productvariant ORDER BY id ASC LIMIT 1")->fetchColumn();
    assertTrue($productVariantId > 0, 'No product variant found. Please run seeder first.');

    $orderNumber = 'M5-REV-' . date('YmdHis') . '-' . random_int(100, 999);
    $paidAmount = 987654.00;

    $insertOrder = $pdo->prepare(
        "INSERT INTO `order` (user_id, order_number, total_amount, discount_amount, shipping_fee, status, shipping_address, billing_address, placed_at, production_step)
         VALUES (?, ?, ?, 0, 0, 'paid', 'M5 Revenue Test Shipping Address', 'M5 Revenue Test Billing Address', NOW(), 'lens_cutting')"
    );
    $insertOrder->execute([$userId, $orderNumber, $paidAmount]);
    $orderId = (int) $pdo->lastInsertId();

    $insertOrderItem = $pdo->prepare(
        "INSERT INTO orderitem (order_id, productvariant_id, lens_id, prescription_id, quantity, unit_price, line_total)
         VALUES (?, ?, NULL, NULL, 1, ?, ?)"
    );
    $insertOrderItem->execute([$orderId, $productVariantId, $paidAmount, $paidAmount]);

    $insertPayment = $pdo->prepare(
        "INSERT INTO payment (order_id, payment_method, amount, status, transaction_ref, paid_at)
         VALUES (?, 'card', ?, 'paid', ?, NOW())"
    );
    $transactionRef = 'M5REV' . strtoupper(substr(md5((string) microtime(true)), 0, 10));
    $insertPayment->execute([$orderId, $paidAmount, $transactionRef]);
    $paymentId = (int) $pdo->lastInsertId();

    try {
        $dbRevenue = (float) $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM payment WHERE status = 'paid'")->fetchColumn();
        $apiResponse = captureDashboardResponse();
        $apiRevenue = (float) ($apiResponse['data']['revenue'] ?? 0);

        assertTrue(abs($apiRevenue - $dbRevenue) < 0.01, 'API revenue does not match paid invoices. DB=' . $dbRevenue . ', API=' . $apiRevenue);

        echo 'PASS: dashboard revenue matches paid invoices at ' . number_format($apiRevenue, 2) . "\n";
    } finally {
        $cleanupPayment = $pdo->prepare("DELETE FROM payment WHERE id = ?");
        $cleanupPayment->execute([$paymentId]);

        $cleanupOrderItem = $pdo->prepare("DELETE FROM orderitem WHERE order_id = ?");
        $cleanupOrderItem->execute([$orderId]);

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
