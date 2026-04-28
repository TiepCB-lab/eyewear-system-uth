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

function parse_env_file(string $path): array {
    $result = [];
    $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return [];
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || str_starts_with($line, ';') || !str_contains($line, '=')) {
            continue;
        }

        [$name, $value] = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);

        if (($value !== '') && (($value[0] === '"' && str_ends_with($value, '"')) || ($value[0] === "'" && str_ends_with($value, "'")))) {
            $value = substr($value, 1, -1);
        }

        $result[$name] = $value;
    }

    return $result;
}

function load_env_config(): array {
    foreach ([
        APP_ROOT . DIRECTORY_SEPARATOR . '.env.local',
        APP_ROOT . DIRECTORY_SEPARATOR . '.env',
        dirname(APP_ROOT) . DIRECTORY_SEPARATOR . '.env',
    ] as $path) {
        if (is_file($path)) {
            return parse_env_file($path);
        }
    }

    return [];
}

echo "Starting Database Seeder...\n";

$config = load_env_config();
$dsn = sprintf(
    'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
    env_value($config, ['DB_HOST', 'MYSQL_HOST'], '127.0.0.1'),
    env_value($config, ['DB_PORT', 'MYSQL_PORT'], '3306'),
    env_value($config, ['DB_DATABASE', 'MYSQL_DATABASE'], 'eyewear_system')
);
$username = env_value($config, ['DB_USERNAME', 'MYSQL_USER'], 'root');
$password = env_value($config, ['DB_PASSWORD', 'MYSQL_PASSWORD'], '');

try {
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    echo "Connected to database.\n";

    $pdo->exec("\n        INSERT INTO role (name, description) VALUES\n            ('ADMIN', 'System-level control ONLY'),\n            ('MANAGER', 'Business management'),\n            ('SALES_STAFF', 'Customer/order handling'),\n            ('OPERATIONS_STAFF', 'Fulfillment/logistics'),\n            ('CUSTOMER', 'Customer')\n        ON DUPLICATE KEY UPDATE description = VALUES(description);\n    ");

    $permissions = [
        'view_products' => 'View products',
        'search_products' => 'Search products',
        'view_product_detail' => 'View product details',
        'manage_cart' => 'Manage shopping cart',
        'create_order' => 'Create new orders',
        'view_own_orders' => 'View own orders',
        'request_return' => 'Request a return',
        'view_orders' => 'View all orders',
        'validate_prescription' => 'Validate prescription details',
        'contact_customer' => 'Contact customers',
        'confirm_order' => 'Confirm orders',
        'handle_preorder' => 'Handle preorders',
        'handle_returns' => 'Handle returns',
        'pack_order' => 'Pack orders',
        'create_shipment' => 'Create shipment',
        'update_tracking' => 'Update tracking info',
        'process_preorder_inventory' => 'Process preorder inventory',
        'process_prescription_orders' => 'Process prescription orders',
        'update_order_status' => 'Update order status',
        'manage_products' => 'Manage products',
        'manage_pricing' => 'Manage pricing',
        'manage_promotions' => 'Manage promotions',
        'manage_users' => 'Manage users',
        'view_reports' => 'View reports',
        'manage_policies' => 'Manage policies',
        'manage_roles' => 'Manage roles',
        'manage_permissions' => 'Manage permissions',
        'manage_system_config' => 'Manage system config',
        'manage_all_users' => 'Manage all users',
        'view_system_logs' => 'View system logs'
    ];

    foreach ($permissions as $name => $desc) {
        $pdo->exec("INSERT INTO permissions (name, description) VALUES ('$name', '$desc') ON DUPLICATE KEY UPDATE description = VALUES(description)");
    }

    $rolePermissions = [
        'CUSTOMER' => ['view_products', 'search_products', 'view_product_detail', 'manage_cart', 'create_order', 'view_own_orders', 'request_return'],
        'SALES_STAFF' => ['view_orders', 'validate_prescription', 'contact_customer', 'confirm_order', 'handle_preorder', 'handle_returns'],
        'OPERATIONS_STAFF' => ['pack_order', 'create_shipment', 'update_tracking', 'process_preorder_inventory', 'process_prescription_orders', 'update_order_status'],
        'MANAGER' => ['manage_products', 'manage_pricing', 'manage_promotions', 'manage_users', 'view_reports', 'manage_policies'],
        'ADMIN' => ['manage_roles', 'manage_permissions', 'manage_system_config', 'manage_all_users', 'view_system_logs']
    ];

    foreach ($rolePermissions as $roleName => $perms) {
        $roleId = $pdo->query("SELECT id FROM role WHERE name = '$roleName'")->fetchColumn();
        if ($roleId) {
            foreach ($perms as $perm) {
                $permId = $pdo->query("SELECT id FROM permissions WHERE name = '$perm'")->fetchColumn();
                if ($permId) {
                    $pdo->exec("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES ($roleId, $permId)");
                }
            }
        }
    }

    $pdo->exec("\n        INSERT INTO category (name, slug, description) VALUES\n            ('Gọng kính', 'gong-kinh', 'Các loại gọng kính thời trang'),\n            ('Kính râm', 'kinh-ram', 'Kính chống nắng và bảo vệ mắt'),\n            ('Tròng kính', 'trong-kinh', 'Các loại tròng kính thuốc')\n        ON DUPLICATE KEY UPDATE name = VALUES(name);\n    ");

    $categoryIds = [
        'gong-kinh' => (int) $pdo->query("SELECT id FROM category WHERE slug = 'gong-kinh'")->fetchColumn(),
        'kinh-ram' => (int) $pdo->query("SELECT id FROM category WHERE slug = 'kinh-ram'")->fetchColumn(),
        'trong-kinh' => (int) $pdo->query("SELECT id FROM category WHERE slug = 'trong-kinh'")->fetchColumn(),
    ];

    $pdo->exec("\n        DELETE inventory\n        FROM inventory\n        INNER JOIN productvariant ON inventory.productvariant_id = productvariant.id\n        INNER JOIN product ON productvariant.product_id = product.id\n        WHERE product.slug LIKE 'evls-%';\n    ");
    $pdo->exec("\n        DELETE cartitem\n        FROM cartitem\n        INNER JOIN productvariant ON cartitem.productvariant_id = productvariant.id\n        INNER JOIN product ON productvariant.product_id = product.id\n        WHERE product.slug LIKE 'evls-%';\n    ");
    $pdo->exec("\n        DELETE orderitem\n        FROM orderitem\n        INNER JOIN productvariant ON orderitem.productvariant_id = productvariant.id\n        INNER JOIN product ON productvariant.product_id = product.id\n        WHERE product.slug LIKE 'evls-%';\n    ");
    $pdo->exec("\n        DELETE productvariant\n        FROM productvariant\n        INNER JOIN product ON productvariant.product_id = product.id\n        WHERE product.slug LIKE 'evls-%';\n    ");
    $pdo->exec("DELETE FROM product WHERE slug LIKE 'evls-%';");

    $productStmt = $pdo->prepare("\n        INSERT INTO product (category_id, name, model_name, slug, base_price, brand, gender)\n        VALUES (?, ?, ?, ?, ?, ?, ?)\n        ON DUPLICATE KEY UPDATE\n            category_id = VALUES(category_id),\n            name = VALUES(name),\n            model_name = VALUES(model_name),\n            base_price = VALUES(base_price),\n            brand = VALUES(brand),\n            gender = VALUES(gender)\n    ");

    $variantStmt = $pdo->prepare("\n        INSERT INTO productvariant (product_id, sku, color, size, stock_quantity, image_2d_url)\n        VALUES (?, ?, ?, ?, ?, ?)\n        ON DUPLICATE KEY UPDATE\n            product_id = VALUES(product_id),\n            color = VALUES(color),\n            size = VALUES(size),\n            stock_quantity = VALUES(stock_quantity),\n            image_2d_url = VALUES(image_2d_url)\n    ");

    $imagePool = [
        '/assets/images/products/ELVS_Tròn trà.png',
        '/assets/images/products/EVLS_Lục giác nâu.jpg',
        '/assets/images/products/EVLS_Lục giác.png',
        '/assets/images/products/EVLS_Lục giác_xám.png',
        '/assets/images/products/EVLS_mắt mèo trà.jpeg',
        '/assets/images/products/EVLS_oval nâu.jpeg',
        '/assets/images/products/EVLS_oval trà.jpeg',
        '/assets/images/products/EVLS_oval đen.jpeg',
        '/assets/images/products/EVLS_tròn cf.png',
        '/assets/images/products/EVLS_Tròn ghi.jpg',
        '/assets/images/products/EVLS_tròn hồng.jpeg',
        '/assets/images/products/EVLS_tròn không gọng.jpeg',
        '/assets/images/products/EVLS_Tròn kim loại.jpg',
        '/assets/images/products/EVLS_Tròn màu.jpg',
        '/assets/images/products/EVLS_tròn xám.jpeg',
        '/assets/images/products/EVLS_Tròn đen trên.jpg',
        '/assets/images/products/EVLS_Tròn đen.jpg',
        '/assets/images/products/EVLS_Tròn.png',
        '/assets/images/products/EVLS_vuông ghi.jpeg',
        '/assets/images/products/EVLS_vuông kim loại.png',
        '/assets/images/products/EVLS_vuông nâu.png',
        '/assets/images/products/EVLS_Tròn đen đẹp.jpg',
        '/assets/images/products/EVLS_vuông trà.jpeg',
        '/assets/images/products/EVLS_vuông tròn đen.png',
        '/assets/images/products/EVLS_vuông trắng.jpg',
        '/assets/images/products/EVLS_vuông xám.png',
        '/assets/images/products/EVLS_vuông xéo ghi.png',
        '/assets/images/products/EVLS_vuông đen to.jpeg',
        '/assets/images/products/EVLS_vuông đen.png',
        '/assets/images/products/EVLS_đen vuông.jpeg',
    ];

    $groups = [
        [
            'category' => 'gong-kinh',
            'prefix' => 'EVLS Clear Frame',
            'model' => 'EVLS-CLR',
            'brand' => 'EVLS',
            'gender' => 'women',
            'color' => 'Clear',
            'size' => 'M',
            'base_price' => 400000,
            'stock' => 30,
            'count' => 8,
        ],
        [
            'category' => 'gong-kinh',
            'prefix' => 'EVLS Black Square',
            'model' => 'EVLS-BLK',
            'brand' => 'EVLS',
            'gender' => 'unisex',
            'color' => 'Black',
            'size' => 'L',
            'base_price' => 500000,
            'stock' => 32,
            'count' => 8,
        ],
        [
            'category' => 'kinh-ram',
            'prefix' => 'EVLS Sun Style',
            'model' => 'EVLS-SUN',
            'brand' => 'EVLS',
            'gender' => 'women',
            'color' => 'Brown',
            'size' => 'L',
            'base_price' => 620000,
            'stock' => 24,
            'count' => 7,
        ],
        [
            'category' => 'trong-kinh',
            'prefix' => 'EVLS Lens Pro',
            'model' => 'EVLS-LENS',
            'brand' => 'EVLS',
            'gender' => 'unisex',
            'color' => 'Blue Cut',
            'size' => 'Standard',
            'base_price' => 720000,
            'stock' => 40,
            'count' => 7,
        ],
    ];

    $productIndex = 1;
    foreach ($groups as $group) {
        for ($i = 0; $i < $group['count']; $i++) {
            $sequence = str_pad((string) $productIndex, 2, '0', STR_PAD_LEFT);
            $stockOffset = ($i % 5) * 3;
            $name = $group['prefix'] . ' ' . $sequence;
            $modelName = $group['model'] . '-' . $sequence;
            $slug = strtolower(str_replace(' ', '-', $name));
            $sku = $group['model'] . '-' . $sequence;
            $image = $imagePool[($productIndex - 1) % count($imagePool)];
            $price = $group['base_price'] + ($i * 10000);

            $productStmt->execute([
                $categoryIds[$group['category']],
                $name,
                $modelName,
                $slug,
                $price,
                $group['brand'],
                $group['gender'],
            ]);

            $productId = (int) $pdo->query("SELECT id FROM product WHERE slug = " . $pdo->quote($slug))->fetchColumn();
            $variantStmt->execute([
                $productId,
                $sku,
                $group['color'],
                $group['size'],
                $group['stock'] + $stockOffset,
                $image,
            ]);

            $productIndex++;
        }
    }

    $pdo->exec("\n        INSERT INTO inventory (productvariant_id, quantity)\n        SELECT id, stock_quantity FROM productvariant\n        ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);\n    ");

    $pdo->exec("\n        INSERT INTO lens (name, lens_type, type, material, price) VALUES\n            ('Cơ bản', 'Basic', 'single_vision', 'Plastic', 200000),\n            ('Chống ánh sáng xanh', 'BlueCut', 'single_vision', 'Poly', 500000),\n            ('Đổi màu khói', 'Photochromic', 'single_vision', 'HighIndex', 1200000)\n        ON DUPLICATE KEY UPDATE price = VALUES(price);\n    ");

    echo "Successfully seeded product data.\n";

    $passHash = password_hash('password123', PASSWORD_DEFAULT);
    $pdo->exec("\n        INSERT INTO `user` (full_name, email, password_hash, status) VALUES\n            ('System Admin', 'admin@eyewear.com', '$passHash', 'active'),\n            ('Project Manager', 'manager@eyewear.com', '$passHash', 'active'),\n            ('Sales Staff', 'sales@eyewear.com', '$passHash', 'active'),\n            ('Operations Staff', 'operations@eyewear.com', '$passHash', 'active'),\n            ('Test Customer', 'customer@eyewear.com', '$passHash', 'active')\n        ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);\n    ");

    $adminId = $pdo->query("SELECT id FROM `user` WHERE email = 'admin@eyewear.com'")->fetchColumn();
    $managerId = $pdo->query("SELECT id FROM `user` WHERE email = 'manager@eyewear.com'")->fetchColumn();
    $salesId = $pdo->query("SELECT id FROM `user` WHERE email = 'sales@eyewear.com'")->fetchColumn();
    $operationsId = $pdo->query("SELECT id FROM `user` WHERE email = 'operations@eyewear.com'")->fetchColumn();
    $customerId = $pdo->query("SELECT id FROM `user` WHERE email = 'customer@eyewear.com'")->fetchColumn();

    $roleAdmin = $pdo->query("SELECT id FROM role WHERE name = 'ADMIN'")->fetchColumn();
    $roleManager = $pdo->query("SELECT id FROM role WHERE name = 'MANAGER'")->fetchColumn();
    $roleSales = $pdo->query("SELECT id FROM role WHERE name = 'SALES_STAFF'")->fetchColumn();
    $roleOperations = $pdo->query("SELECT id FROM role WHERE name = 'OPERATIONS_STAFF'")->fetchColumn();
    $roleCustomer = $pdo->query("SELECT id FROM role WHERE name = 'CUSTOMER'")->fetchColumn();

    $pdo->exec("\n        INSERT IGNORE INTO user_roles (user_id, role_id) VALUES\n            ($adminId, $roleAdmin),\n            ($managerId, $roleManager),\n            ($salesId, $roleSales),\n            ($operationsId, $roleOperations),\n            ($customerId, $roleCustomer)\n    ");

    echo "Successfully seeded all data including users and multiple roles.\n";
} catch (PDOException $e) {
    echo "Seed failed: " . $e->getMessage() . "\n";
}
