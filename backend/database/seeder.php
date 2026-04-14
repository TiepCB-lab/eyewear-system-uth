<?php

define('APP_ROOT', dirname(__DIR__));

function env_value(array $config, array $keys, $default = null) {
    foreach ($keys as $key) {
        if (isset($config[$key]) && $config[$key] !== '') {
            return $config[$key];
        }
    }
    return $default;
}

function load_env_config() {
    $candidates = [
        APP_ROOT . DIRECTORY_SEPARATOR . '.env',
        dirname(APP_ROOT) . DIRECTORY_SEPARATOR . '.env',
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

echo "Starting Database Seeder...\n";

$config = load_env_config();

$host = env_value($config, ['DB_HOST', 'MYSQL_HOST'], '127.0.0.1');
$port = env_value($config, ['DB_PORT', 'MYSQL_PORT'], '3306');
$database = env_value($config, ['DB_DATABASE', 'MYSQL_DATABASE'], 'eyewear_system');
$username = env_value($config, ['DB_USERNAME', 'MYSQL_USER'], 'root');
$password = env_value($config, ['DB_PASSWORD', 'MYSQL_PASSWORD'], '');

try {
    $dsn = 'mysql:host=' . $host . ';port=' . $port . ';dbname=' . $database . ';charset=utf8mb4';
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "Connected to database '{$database}'.\n";

    // 1. Roles
    $pdo->exec("
    INSERT INTO role (name, description) VALUES
        ('system_admin', 'Cấu hình và quản trị chức năng hệ thống'),
        ('manager', 'Quản lý quy định, sản phẩm, giá, nhân sự, doanh thu'),
        ('sales_staff', 'Tiếp nhận đơn, ưu đãi, khiếu nại, xác nhận thông số kính'),
        ('operations_staff', 'Đóng gói, giao vận, gia công tròng kính'),
        ('customer', 'Xem sản phẩm, đặt hàng, quản lý tài khoản')
    ON DUPLICATE KEY UPDATE description = VALUES(description);
    ");

    // 2. Categories
    $pdo->exec("
    INSERT INTO category (name, slug, description) VALUES
        ('Gọng kính', 'gong-kinh', 'Các loại gọng kính thời trang'),
        ('Kính râm', 'kinh-ram', 'Kính chống nắng và bảo vệ mắt'),
        ('Tròng kính', 'trong-kinh', 'Các loại tròng kính thuốc')
    ON DUPLICATE KEY UPDATE name = VALUES(name);
    ");

    // 3. Products
    $catId = $pdo->query("SELECT id FROM category WHERE slug = 'gong-kinh'")->fetchColumn();
    
    $pdo->exec("
    INSERT INTO product (category_id, name, model_name, slug, base_price, brand, gender) VALUES
        ($catId, 'Ray-Ban Aviator', 'RB3025', 'ray-ban-aviator', 3500000, 'Ray-Ban', 'unisex'),
        ($catId, 'Oakley Holbrook', 'OO9102', 'oakley-holbrook', 2800000, 'Oakley', 'men')
    ON DUPLICATE KEY UPDATE name = VALUES(name);
    ");

    $rbId = $pdo->query("SELECT id FROM product WHERE slug = 'ray-ban-aviator'")->fetchColumn();
    $okId = $pdo->query("SELECT id FROM product WHERE slug = 'oakley-holbrook'")->fetchColumn();

    // 4. Variants
    $pdo->exec("
    INSERT INTO productvariant (product_id, sku, color, size, stock_quantity) VALUES
        ($rbId, 'RB-AVI-GLD', 'Gold', 'L', 50),
        ($rbId, 'RB-AVI-SLV', 'Silver', 'M', 30),
        ($okId, 'OK-HOL-BLK', 'Matte Black', 'Standard', 100)
    ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity);
    ");

    // 5. Inventory sync
    $pdo->exec("
    INSERT INTO inventory (productvariant_id, quantity) 
    SELECT id, stock_quantity FROM productvariant
    ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);
    ");

    // 6. Lenses
    $pdo->exec("
    INSERT INTO lens (name, lens_type, type, material, price) VALUES
        ('Cơ bản', 'Basic', 'single_vision', 'Plastic', 200000),
        ('Chống ánh sáng xanh', 'BlueCut', 'single_vision', 'Poly', 500000),
        ('Đổi màu khói', 'Photochromic', 'single_vision', 'HighIndex', 1200000)
    ON DUPLICATE KEY UPDATE price = VALUES(price);
    ");

    echo "Successfully seeded all data for Member 3 testing.\n";
    
} catch (PDOException $e) {
    echo "Seed failed: " . $e->getMessage() . "\n";
}
