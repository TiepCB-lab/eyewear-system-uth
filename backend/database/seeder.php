<?php

define('APP_ROOT', dirname(__DIR__));

if (!function_exists('env_value')) {
    function env_value(array $config, array $keys, $default = null)
    {
        foreach ($keys as $key) {
            if (isset($config[$key]) && $config[$key] !== '') {
                return $config[$key];
            }
        }
        return $default;
    }
}

if (!function_exists('parse_env_file')) {
    function parse_env_file(string $path): array
    {
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
}

if (!function_exists('load_env_config')) {
    function load_env_config(): array
    {
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

    $pdo->exec("\n        INSERT INTO role (name, description) VALUES\n            ('ADMIN', 'Full system access'),\n            ('MANAGER', 'Business management and oversight'),\n            ('SALES_STAFF', 'Order verification and customer communication'),\n            ('OPERATIONS_STAFF', 'Production processing and fulfillment'),\n            ('CUSTOMER', 'Default registered customer')\n        ON DUPLICATE KEY UPDATE description = VALUES(description);\n    ");

    $permissions = [
        // Customer Permissions
        'view_products' => 'Ability to view product details',
        'search_products' => 'Search products',
        'view_product_detail' => 'View product details',
        'manage_cart' => 'Manage shopping cart',
        'create_order' => 'Create new orders',
        'checkout' => 'Checkout process',
        'make_payment' => 'Make payments',
        'view_own_orders' => 'View own orders',
        'request_return' => 'Request a return',
        'manage_profile' => 'Manage personal profile',

        // Staff Permissions
        'view_orders' => 'Ability to view order history and details',
        'confirm_order' => 'Ability to verify and confirm pending orders',
        'update_order_status' => 'Ability to advance production steps',
        'pack_order' => 'Ability to prepare shipments',
        'contact_customer' => 'Ability to reply to support tickets',
        'validate_prescription' => 'Validate prescription details',
        'handle_preorder' => 'Handle preorders',
        'handle_returns' => 'Handle returns',
        'create_shipment' => 'Create shipment',
        'update_tracking' => 'Update tracking info',
        'process_preorder_inventory' => 'Process preorder inventory',
        'process_prescription_orders' => 'Process prescription orders',

        // Management & Admin Permissions
        'manage_products' => 'Ability to create/edit/delete products',
        'manage_pricing' => 'Manage pricing',
        'manage_promotions' => 'Manage promotions',
        'manage_users' => 'Ability to manage staff accounts',
        'view_reports' => 'Ability to access dashboard analytics',
        'manage_policies' => 'Manage policies',
        'manage_roles' => 'Ability to manage role permissions',
        'manage_permissions' => 'Manage permissions list',
        'manage_system_config' => 'Manage system config',
        'manage_all_users' => 'Manage all users',
        'view_system_logs' => 'View system logs'
    ];

    foreach ($permissions as $name => $desc) {
        $pdo->exec("INSERT INTO permissions (name, description) VALUES ('$name', '$desc') ON DUPLICATE KEY UPDATE description = VALUES(description)");
    }

    $rolePermissions = [
        'CUSTOMER' => [
            'view_products',
            'search_products',
            'view_product_detail',
            'manage_cart',
            'create_order',
            'checkout',
            'make_payment',
            'view_own_orders',
            'request_return',
            'manage_profile'
        ],
        'SALES_STAFF' => [
            'view_orders',
            'validate_prescription',
            'contact_customer',
            'confirm_order',
            'handle_preorder',
            'handle_returns'
        ],
        'OPERATIONS_STAFF' => [
            'view_orders',
            'pack_order',
            'create_shipment',
            'update_tracking',
            'process_preorder_inventory',
            'process_prescription_orders',
            'update_order_status'
        ],
        'MANAGER' => [
            'manage_products',
            'manage_pricing',
            'manage_promotions',
            'manage_users',
            'view_reports',
            'manage_policies'
        ],
        'ADMIN' => [
            'manage_roles',
            'manage_permissions',
            'manage_system_config',
            'manage_users',
            'view_system_logs'
        ]
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

    $pdo->exec("\n        INSERT INTO category (name, slug, description) VALUES\n            ('Frames', 'gong-kinh', 'Fashion eyeglass frames and styles'),\n            ('Sunglasses', 'kinh-ram', 'Sunglasses and UV protection eyewear'),\n            ('Lenses', 'trong-kinh', 'Prescription and specialty lenses')\n        ON DUPLICATE KEY UPDATE name = VALUES(name);\n    ");

    $categoryIds = [
        'gong-kinh' => (int) $pdo->query("SELECT id FROM category WHERE slug = 'gong-kinh'")->fetchColumn(),
        'kinh-ram' => (int) $pdo->query("SELECT id FROM category WHERE slug = 'kinh-ram'")->fetchColumn(),
        'trong-kinh' => (int) $pdo->query("SELECT id FROM category WHERE slug = 'trong-kinh'")->fetchColumn(),
    ];

    $pdo->exec("DELETE FROM inventory");
    $pdo->exec("DELETE FROM cartitem");
    $pdo->exec("DELETE FROM orderitem");
    $pdo->exec("DELETE FROM productvariant");
    $pdo->exec("DELETE FROM wishlist");
    $pdo->exec("DELETE FROM product");

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
        '/assets/images/products/EVLS_Tròn đen đẹp.jpg',
        '/assets/images/products/EVLS_Tròn.png',
        '/assets/images/products/EVLS_vuông ghi.jpeg',
        '/assets/images/products/EVLS_vuông kim loại.png',
        '/assets/images/products/EVLS_vuông nâu.png',
        '/assets/images/products/EVLS_vuông trà.jpeg',
        '/assets/images/products/EVLS_vuông tròn đen.png',
        '/assets/images/products/EVLS_vuông trắng.jpg',
        '/assets/images/products/EVLS_vuông xám.png',
        '/assets/images/products/EVLS_vuông xéo ghi.png',
        '/assets/images/products/EVLS_vuông đen to.jpeg',
        '/assets/images/products/EVLS_vuông đen.png',
        '/assets/images/products/EVLS_đen vuông.jpeg',
        '/assets/images/products/frame-an-01.jpeg',
        '/assets/images/products/frame-an-02.jpeg',
        '/assets/images/products/frame-an-03.png',
        '/assets/images/products/frame-an-04.png',
        '/assets/images/products/frame-an-05.png',
        '/assets/images/products/frame-an-06.png',
        '/assets/images/products/frame-an-07.png',
        '/assets/images/products/frame-an-08.png',
        '/assets/images/products/frame-an-09.png',
        '/assets/images/products/frame-anna-01.jpeg',
        '/assets/images/products/frame-jn-01.jpeg',
        '/assets/images/products/frame-jn-02.jpeg',
        '/assets/images/products/frame-jn-03.jpeg',
        '/assets/images/products/frame-jn-04.jpeg',
        '/assets/images/products/frame-classic-01.jpeg',
        '/assets/images/products/frame-white-bg.jpeg',
        '/assets/images/products/frame-opt-2701.png',
        '/assets/images/products/frame-opt-2702.png',
        '/assets/images/products/frame-bevis-01.jpeg',
        '/assets/images/products/frame-bevis-02.jpeg',
        '/assets/images/products/frame-studio-01.jpeg',
        '/assets/images/products/frame-white-studio.jpeg',
        '/assets/images/products/frame-s868.jpeg',
        '/assets/images/products/frame-tr27.jpeg',
    ];

    $lensImages = [
        '/assets/images/lens/bevis optical.jpg',
        '/assets/images/lens/chemi U2 1.67.jpg',
        '/assets/images/lens/chemi U6 1.60.jpg',
        '/assets/images/lens/chemi U6 1.67.jpg',
        '/assets/images/lens/chemi U6 1.74.jpg',
        '/assets/images/lens/elements.jpg',
        '/assets/images/lens/essilor crizal.jpg',
    ];

    $groups = [
        [
            'category' => 'trong-kinh',
            'prefix' => 'Lens Bevis Optical',
            'model' => 'LENS-BVO',
            'brand' => 'Bevis',
            'gender' => 'unisex',
            'color' => 'Clear',
            'size' => 'STD',
            'base_price' => 200000,
            'stock' => 50,
            'count' => 1,
            'image_index' => 0,
            'lens_details' => [
                'lens_type' => 'Basic',
                'type' => 'single_vision',
                'material' => 'Plastic',
                'index_value' => 1.56,
                'coating' => 'Hard Coat'
            ]
        ],
        [
            'category' => 'trong-kinh',
            'prefix' => 'Lens Chemi U2 1.67',
            'model' => 'LENS-CHU2',
            'brand' => 'Chemi',
            'gender' => 'unisex',
            'color' => 'Clear',
            'size' => 'STD',
            'base_price' => 850000,
            'stock' => 50,
            'count' => 1,
            'image_index' => 1,
            'lens_details' => [
                'lens_type' => 'Anti-Reflective',
                'type' => 'single_vision',
                'material' => 'Resin',
                'index_value' => 1.67,
                'coating' => 'U2'
            ]
        ],
        [
            'category' => 'trong-kinh',
            'prefix' => 'Lens Chemi U6 1.60',
            'model' => 'LENS-CHU6-160',
            'brand' => 'Chemi',
            'gender' => 'unisex',
            'color' => 'Clear',
            'size' => 'STD',
            'base_price' => 1900000,
            'stock' => 50,
            'count' => 1,
            'image_index' => 2,
        ],
        [
            'category' => 'trong-kinh',
            'prefix' => 'Lens Chemi U6 1.67',
            'model' => 'LENS-CHU6-167',
            'brand' => 'Chemi',
            'gender' => 'unisex',
            'color' => 'Clear',
            'size' => 'STD',
            'base_price' => 2100000,
            'stock' => 50,
            'count' => 1,
            'image_index' => 3,
        ],
        [
            'category' => 'trong-kinh',
            'prefix' => 'Lens Chemi U6 1.74',
            'model' => 'LENS-CHU6-174',
            'brand' => 'Chemi',
            'gender' => 'unisex',
            'color' => 'Clear',
            'size' => 'STD',
            'base_price' => 2500000,
            'stock' => 50,
            'count' => 1,
            'image_index' => 4,
        ],
        [
            'category' => 'trong-kinh',
            'prefix' => 'Lens Elements',
            'model' => 'LENS-ELM',
            'brand' => 'Elements',
            'gender' => 'unisex',
            'color' => 'Clear',
            'size' => 'STD',
            'base_price' => 2300000,
            'stock' => 50,
            'count' => 1,
            'image_index' => 5,
        ],
        [
            'category' => 'trong-kinh',
            'prefix' => 'Lens Essilor Crizal',
            'model' => 'LENS-ESS',
            'brand' => 'Essilor',
            'gender' => 'unisex',
            'color' => 'Clear',
            'size' => 'STD',
            'base_price' => 2800000,
            'stock' => 50,
            'count' => 1,
            'image_index' => 6,
        ],
        [
            'category' => 'kinh-ram',
            'prefix' => 'Sunglasses Black Classic',
            'model' => 'SUNGLASS-BLK-CLS',
            'brand' => 'Classic',
            'gender' => 'unisex',
            'color' => 'Black',
            'size' => 'M',
            'base_price' => 500000,
            'stock' => 40,
            'count' => 1,
            'image_index' => 0, // sunglasses-black-classic.jpg
        ],
        [
            'category' => 'kinh-ram',
            'prefix' => 'Sunglasses Black Hot',
            'model' => 'SUNGLASS-BLK-HOT',
            'brand' => 'Premium',
            'gender' => 'unisex',
            'color' => 'Black',
            'size' => 'M',
            'base_price' => 550000,
            'stock' => 38,
            'count' => 1,
            'image_index' => 1, // sunglasses-black-hot.jpg
        ],
        [
            'category' => 'kinh-ram',
            'prefix' => 'Sunglasses Black Oval',
            'model' => 'SUNGLASS-BLK-OVL',
            'brand' => 'Fashion',
            'gender' => 'unisex',
            'color' => 'Black',
            'size' => 'M',
            'base_price' => 600000,
            'stock' => 36,
            'count' => 1,
            'image_index' => 2, // sunglasses-black-oval.jpg
        ],
        [
            'category' => 'kinh-ram',
            'prefix' => 'Sunglasses Black Square',
            'model' => 'SUNGLASS-BLK-SQR',
            'brand' => 'Modern',
            'gender' => 'unisex',
            'color' => 'Black',
            'size' => 'L',
            'base_price' => 650000,
            'stock' => 35,
            'count' => 1,
            'image_index' => 3, // sunglasses-black-square.jpg
        ],
        [
            'category' => 'kinh-ram',
            'prefix' => 'Sunglasses Brown Square',
            'model' => 'SUNGLASS-BRN-SQR',
            'brand' => 'Elegant',
            'gender' => 'women',
            'color' => 'Brown',
            'size' => 'M',
            'base_price' => 700000,
            'stock' => 32,
            'count' => 1,
            'image_index' => 4, // sunglasses-brown-square.jpg
        ],
        [
            'category' => 'kinh-ram',
            'prefix' => 'Sunglasses Brown',
            'model' => 'SUNGLASS-BRN',
            'brand' => 'Stylish',
            'gender' => 'women',
            'color' => 'Brown',
            'size' => 'M',
            'base_price' => 750000,
            'stock' => 34,
            'count' => 1,
            'image_index' => 5, // sunglasses-brown.jpg
        ],
        [
            'category' => 'kinh-ram',
            'prefix' => 'Sunglasses Pink',
            'model' => 'SUNGLASS-PNK',
            'brand' => 'Trendy',
            'gender' => 'women',
            'color' => 'Pink',
            'size' => 'M',
            'base_price' => 800000,
            'stock' => 30,
            'count' => 1,
            'image_index' => 6, // sunglasses-pink.jpg
        ],
        [
            'category' => 'kinh-ram',
            'prefix' => 'Sunglasses White Square',
            'model' => 'SUNGLASS-WHT-SQR',
            'brand' => 'Chic',
            'gender' => 'women',
            'color' => 'White',
            'size' => 'M',
            'base_price' => 850000,
            'stock' => 28,
            'count' => 1,
            'image_index' => 7, // sunglasses-white-square.jpg
        ],
        [
            'category' => 'kinh-ram',
            'prefix' => 'Sunglasses White',
            'model' => 'SUNGLASS-WHT',
            'brand' => 'Premium White',
            'gender' => 'women',
            'color' => 'White',
            'size' => 'M',
            'base_price' => 900000,
            'stock' => 25,
            'count' => 1,
            'image_index' => 8, // sunglasses-white.jpg
        ],
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
            'category' => 'gong-kinh',
            'prefix' => 'EVLS Metal Series',
            'model' => 'EVLS-MTL',
            'brand' => 'EVLS',
            'gender' => 'unisex',
            'color' => 'Silver',
            'size' => 'M',
            'base_price' => 550000,
            'stock' => 25,
            'count' => 7,
        ],
        [
            'category' => 'gong-kinh',
            'prefix' => 'EVLS Sport Frame',
            'model' => 'EVLS-SPT',
            'brand' => 'EVLS',
            'gender' => 'men',
            'color' => 'Matte Black',
            'size' => 'L',
            'base_price' => 480000,
            'stock' => 28,
            'count' => 7,
        ],
        [
            'category' => 'gong-kinh',
            'prefix' => 'EVLS Heritage Gold',
            'model' => 'EVLS-HGD',
            'brand' => 'EVLS Premium Heritage',
            'gender' => 'unisex',
            'color' => 'Gold',
            'size' => 'M',
            'base_price' => 1250000,
            'stock' => 0, // Out of stock for testing
            'count' => 2,
        ],
    ];

    $sunglassesImages = [
        '/assets/images/products/sunglasses-black-classic.jpg',
        '/assets/images/products/sunglasses-black-hot.jpg',
        '/assets/images/products/sunglasses-black-oval.jpg',
        '/assets/images/products/sunglasses-black-square.jpg',
        '/assets/images/products/sunglasses-brown-square.jpg',
        '/assets/images/products/sunglasses-brown.jpg',
        '/assets/images/products/sunglasses-pink.jpg',
        '/assets/images/products/sunglasses-white-square.jpg',
        '/assets/images/products/sunglasses-white.jpg',
    ];

    $productIndex = 1;
    foreach ($groups as $group) {
        for ($i = 0; $i < $group['count']; $i++) {
            $sequence = str_pad((string) $productIndex, 2, '0', STR_PAD_LEFT);
            $stockOffset = ($i % 5) * 3;
            $name = $group['prefix'] . ($group['count'] > 1 ? ' ' . $sequence : '');
            $modelName = $group['model'] . '-' . $sequence;
            $slug = strtolower(str_replace([' ', '.'], '-', $name));
            $sku = $group['model'] . '-' . $sequence;
            if ($group['category'] === 'kinh-ram') {
                $image = $sunglassesImages[$group['image_index']];
            } elseif ($group['category'] === 'trong-kinh') {
                $image = $lensImages[$group['image_index']];
            } else {
                $image = $imagePool[($productIndex - 1) % count($imagePool)];
            }
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

            // TỰ ĐỘNG LIÊN KẾT VỚI BẢNG LENS NẾU LÀ TRÒNG KÍNH
            if ($group['category'] === 'trong-kinh') {
                $lensDetails = $group['lens_details'] ?? [];

                // Tự động bóc tách chiết suất (Index) từ tên (ví dụ: "1.67")
                $indexValue = $lensDetails['index_value'] ?? 1.56;
                if (!isset($lensDetails['index_value'])) {
                    if (preg_match('/1\.\d+/', $name, $matches)) {
                        $indexValue = floatval($matches[0]);
                    }
                }

                // Thiết lập các giá trị mặc định thông minh
                $lensType = $lensDetails['lens_type'] ?? (strpos($name, 'U6') !== false ? 'Blue Control' : 'Standard');
                $material = $lensDetails['material'] ?? ($group['brand'] === 'Chemi' ? 'Resin' : 'Plastic');
                $coating = $lensDetails['coating'] ?? (strpos($name, 'U2') !== false ? 'U2 Coating' : 'Hard Coat');

                $lensStmt = $pdo->prepare("INSERT INTO lens (product_id, name, lens_type, type, material, index_value, coating, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $lensStmt->execute([
                    $productId,
                    $name,
                    $lensType,
                    $lensDetails['type'] ?? 'single_vision',
                    $material,
                    $indexValue,
                    $coating,
                    $price
                ]);
            }

            $productIndex++;
        }
    }

    $pdo->exec("\n        INSERT INTO inventory (productvariant_id, quantity)\n        SELECT id, stock_quantity FROM productvariant\n        ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);\n    ");

    $pdo->exec("DELETE FROM lens WHERE product_id IS NULL;");

    $passHash = password_hash('123', PASSWORD_DEFAULT);
    $pdo->exec("
        INSERT INTO `user` (full_name, email, password_hash, status) VALUES
            ('System Admin', 'admin@eyewear.com', '$passHash', 'active'),
            ('Project Manager', 'manager@eyewear.com', '$passHash', 'active'),
            ('Sales Staff', 'sales@eyewear.com', '$passHash', 'active'),
            ('Operations Staff', 'operations@eyewear.com', '$passHash', 'active'),
            ('Test Customer', 'customer@eyewear.com', '$passHash', 'active'),
            ('Nguyen Van A', 'vana@gmail.com', '$passHash', 'active'),
            ('Tran Thi B', 'thib@gmail.com', '$passHash', 'active'),
            ('Le Van C', 'vanc@gmail.com', '$passHash', 'active')
        ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);
    ");

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

    $pdo->exec("
        INSERT IGNORE INTO user_roles (user_id, role_id) VALUES
            ($adminId, $roleAdmin),
            ($managerId, $roleManager),
            ($salesId, $roleSales),
            ($operationsId, $roleOperations),
            ($customerId, $roleCustomer)
    ");

    $otherCusEmails = ['vana@gmail.com', 'thib@gmail.com', 'vanc@gmail.com'];
    foreach ($otherCusEmails as $email) {
        $uId = $pdo->query("SELECT id FROM `user` WHERE email = '$email'")->fetchColumn();
        if ($uId) {
            $pdo->exec("INSERT IGNORE INTO user_roles (user_id, role_id) VALUES ($uId, $roleCustomer)");
        }
    }

    echo "Successfully seeded users and roles.\n";

    // --- ENHANCED SEEDING: PROMOTIONS ---
    echo "Seeding promotions...\n";
    $pdo->exec("DELETE FROM promotion");
    $pdo->exec("
        INSERT INTO promotion (code, title, discount_type, discount_value, starts_at, ends_at, is_active) VALUES
            ('WELCOME10', 'Welcome Discount 10%', 'percentage', 10.00, '2024-01-01 00:00:00', '2026-12-31 23:59:59', 1),
            ('SUMMER2024', 'Summer Sale 2024', 'percentage', 20.00, '2024-06-01 00:00:00', '2024-08-31 23:59:59', 1),
            ('SAVE50K', 'Fixed 50k Discount', 'fixed', 50000.00, '2024-01-01 00:00:00', '2026-12-31 23:59:59', 1)
    ");
    $promoId = $pdo->query("SELECT id FROM promotion WHERE code = 'WELCOME10'")->fetchColumn();

    // --- ENHANCED SEEDING: PRESCRIPTIONS ---
    echo "Seeding prescriptions...\n";
    $pdo->exec("DELETE FROM prescription");
    $pdo->prepare("INSERT INTO prescription (user_id, sph_od, sph_os, cyl_od, cyl_os, axis_od, axis_os, pd, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        ->execute([$customerId, -2.50, -2.25, -0.75, -0.50, 180, 175, 63.5, 'Test prescription for daily use']);
    $prescriptionId = $pdo->lastInsertId();

    // --- ENHANCED SEEDING: ORDERS ---
    echo "Seeding varied orders...\n";
    $pdo->exec("DELETE FROM `order` WHERE 1"); // This cascade deletes orderitems, payments, shipments

    $products = $pdo->query("SELECT p.id, pv.id as variant_id, p.base_price FROM product p JOIN productvariant pv ON p.id = pv.product_id LIMIT 10")->fetchAll();
    $lens = $pdo->query("SELECT id, price FROM lens LIMIT 5")->fetchAll();

    $orderStates = [
        [
            'number' => 'ORD-PENDING-001',
            'status' => 'pending',
            'type' => 'stock',
            'items' => [ ['idx' => 0, 'qty' => 1] ]
        ],
        [
            'number' => 'ORD-PREORDER-002',
            'status' => 'paid',
            'type' => 'pre_order',
            'items' => [ ['idx' => 1, 'qty' => 1] ]
        ],
        [
            'number' => 'ORD-PRESCRIPTION-003',
            'status' => 'paid',
            'type' => 'prescription',
            'items' => [ ['idx' => 2, 'qty' => 1, 'lens_idx' => 0, 'presc' => true] ]
        ],
        [
            'number' => 'ORD-PRODUCING-004',
            'status' => 'processing',
            'step' => 'lens_cutting',
            'type' => 'prescription',
            'items' => [ ['idx' => 3, 'qty' => 1, 'lens_idx' => 1, 'presc' => true] ]
        ],
        [
            'number' => 'ORD-READY-005',
            'status' => 'processing',
            'step' => 'ready_to_ship',
            'type' => 'stock',
            'items' => [ ['idx' => 4, 'qty' => 2] ]
        ],
        [
            'number' => 'ORD-SHIPPED-006',
            'status' => 'shipped',
            'step' => 'ready_to_ship',
            'type' => 'stock',
            'shipment' => 'GHTK' . time(),
            'items' => [ ['idx' => 5, 'qty' => 1] ]
        ]
    ];

    foreach ($orderStates as $o) {
        $total = 0;
        foreach ($o['items'] as $item) {
            $total += $products[$item['idx']]['base_price'] * $item['qty'];
            if (isset($item['lens_idx'])) $total += $lens[$item['lens_idx']]['price'] * $item['qty'];
        }

        $stmt = $pdo->prepare("INSERT INTO `order` (user_id, order_number, total_amount, status, production_step, order_type, shipping_address, placed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $customerId,
            $o['number'],
            $total,
            $o['status'],
            $o['step'] ?? null,
            $o['type'],
            '123 Test Street, District 1, HCMC',
            date('Y-m-d H:i:s', strtotime('-' . rand(1, 10) . ' days'))
        ]);
        $orderId = $pdo->lastInsertId();

        // Items
        foreach ($o['items'] as $item) {
            $p = $products[$item['idx']];
            $l = isset($item['lens_idx']) ? $lens[$item['lens_idx']] : null;
            $itemPrice = $p['base_price'] + ($l ? $l['price'] : 0);
            
            $pdo->prepare("INSERT INTO orderitem (order_id, productvariant_id, lens_id, prescription_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)")
                ->execute([
                    $orderId,
                    $p['variant_id'],
                    $l ? $l['id'] : null,
                    isset($item['presc']) ? $prescriptionId : null,
                    $item['qty'],
                    $itemPrice,
                    $itemPrice * $item['qty']
                ]);
        }

        // Payment
        if ($o['status'] !== 'pending') {
            $pdo->prepare("INSERT INTO payment (order_id, payment_method, amount, status, paid_at) VALUES (?, ?, ?, ?, ?)")
                ->execute([$orderId, 'bank_transfer', $total, 'paid', date('Y-m-d H:i:s')]);
        }

        // Shipment
        if (isset($o['shipment'])) {
            $pdo->prepare("INSERT INTO shipment (order_id, courier, tracking_number, shipping_status, shipped_at) VALUES (?, ?, ?, ?, ?)")
                ->execute([$orderId, 'GHTK', $o['shipment'], 'shipping', date('Y-m-d H:i:s')]);
        }
    }

    // --- ADDING MORE ORDERS FOR NEW CUSTOMERS ---
    echo "Seeding additional orders for new customers...\n";
    $newCustomers = $pdo->query("SELECT id FROM `user` WHERE email IN ('vana@gmail.com', 'thib@gmail.com', 'vanc@gmail.com')")->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($newCustomers as $uId) {
        for ($j = 1; $j <= 3; $j++) {
            $orderNum = 'ORD-NEW-' . $uId . '-' . $j . '-' . time();
            $status = ['pending', 'paid', 'shipped'][rand(0, 2)];
            $type = ['stock', 'prescription', 'sunglasses'][rand(0, 2)];
            $total = rand(500000, 3000000);
            
            $pdo->prepare("INSERT INTO `order` (user_id, order_number, total_amount, status, order_type, shipping_address, placed_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
                ->execute([
                    $uId,
                    $orderNum,
                    $total,
                    $status,
                    $type === 'sunglasses' ? 'stock' : $type,
                    '456 Avenue, District 7, HCMC',
                    date('Y-m-d H:i:s', strtotime('-' . rand(1, 5) . ' days'))
                ]);
            $orderId = $pdo->lastInsertId();
            
            // Add 1-2 items per order
            $itemCount = rand(1, 2);
            for ($k = 0; $k < $itemCount; $k++) {
                $p = $products[rand(0, count($products) - 1)];
                $pdo->prepare("INSERT INTO orderitem (order_id, productvariant_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)")
                    ->execute([$orderId, $p['variant_id'], 1, $p['base_price'], $p['base_price']]);
            }
        }
    }

    echo "Seeding complete!\n";

    // --- ENHANCED SEEDING: SUPPORT TICKETS ---
    echo "Seeding support tickets...\n";
    $pdo->exec("DELETE FROM supportticket");
    $tickets = [
        ['subject' => 'Wrong frame color', 'message' => 'I ordered black but got brown.', 'priority' => 'high'],
        ['subject' => 'Delivery delay', 'message' => 'My order is late.', 'priority' => 'medium'],
        ['subject' => 'Broken lens upon arrival', 'message' => 'The left lens has a crack.', 'priority' => 'urgent']
    ];

    foreach ($tickets as $t) {
        $pdo->prepare("INSERT INTO supportticket (user_id, subject, message, status, priority) VALUES (?, ?, ?, ?, ?)")
            ->execute([$customerId, $t['subject'], $t['message'], 'open', $t['priority']]);
        $ticketId = $pdo->lastInsertId();

        // Reply from staff
        $pdo->prepare("INSERT INTO ticket_replies (ticket_id, user_id, message) VALUES (?, ?, ?)")
            ->execute([$ticketId, $salesId, "We are sorry to hear that. Our team is looking into it."]);
    }

    echo "Successfully seeded all 'thick' test data.\n";
} catch (PDOException $e) {
    echo "Seed failed: " . $e->getMessage() . "\n";
}
