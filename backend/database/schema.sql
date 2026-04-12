CREATE DATABASE IF NOT EXISTS eyewear_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE eyewear_system;

CREATE TABLE IF NOT EXISTS role (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(50) NOT NULL UNIQUE,
	description VARCHAR(255) NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `user` (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	role_id BIGINT UNSIGNED NOT NULL,
	full_name VARCHAR(150) NOT NULL,
	email VARCHAR(150) NOT NULL UNIQUE,
	password_hash VARCHAR(255) NOT NULL,
	phone VARCHAR(30) NULL,
	status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES role(id)
		ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS profiles (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	user_id BIGINT UNSIGNED NOT NULL UNIQUE,
	phone VARCHAR(30) NULL,
	address TEXT NULL,
	avatar VARCHAR(255) NULL,
	birthdate DATE NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES `user`(id)
		ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
	email VARCHAR(150) NOT NULL PRIMARY KEY,
	token VARCHAR(255) NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS category (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	slug VARCHAR(160) NOT NULL UNIQUE,
	description TEXT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	category_id BIGINT UNSIGNED NULL,
	name VARCHAR(150) NOT NULL,
	model_name VARCHAR(150) NULL,
	slug VARCHAR(180) NOT NULL UNIQUE,
	description TEXT NULL,
	base_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
	brand VARCHAR(80) NULL,
	gender ENUM('unisex', 'men', 'women', 'kids') DEFAULT 'unisex',
	is_active TINYINT(1) NOT NULL DEFAULT 1,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES category(id)
		ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS productvariant (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	product_id BIGINT UNSIGNED NOT NULL,
	sku VARCHAR(100) NOT NULL UNIQUE,
	color VARCHAR(60) NULL,
	size_code VARCHAR(60) NULL,
	size VARCHAR(60) NULL,
	stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
	image_2d_url VARCHAR(255) NULL,
	model_3d_url VARCHAR(255) NULL,
	additional_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
	price_override DECIMAL(12,2) NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_productvariant_product FOREIGN KEY (product_id) REFERENCES product(id)
		ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	productvariant_id BIGINT UNSIGNED NOT NULL UNIQUE,
	quantity INT UNSIGNED NOT NULL DEFAULT 0,
	reserved_quantity INT UNSIGNED NOT NULL DEFAULT 0,
	reorder_level INT UNSIGNED NOT NULL DEFAULT 5,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_inventory_productvariant FOREIGN KEY (productvariant_id) REFERENCES productvariant(id)
		ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lens (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	type ENUM('single_vision', 'bifocal', 'progressive') NULL,
	lens_type VARCHAR(80) NOT NULL,
	material VARCHAR(120) NULL,
	index_value DECIMAL(4,2) NULL,
	coating VARCHAR(120) NULL,
	price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotion (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	code VARCHAR(60) NOT NULL UNIQUE,
	title VARCHAR(150) NOT NULL,
	discount_type ENUM('percentage', 'fixed') NOT NULL,
	discount_value DECIMAL(12,2) NOT NULL,
	starts_at DATETIME NOT NULL,
	ends_at DATETIME NOT NULL,
	is_active TINYINT(1) NOT NULL DEFAULT 1,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescription (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	user_id BIGINT UNSIGNED NOT NULL,
	sph_od DECIMAL(5,2) NULL,
	sph_os DECIMAL(5,2) NULL,
	cyl_od DECIMAL(5,2) NULL,
	cyl_os DECIMAL(5,2) NULL,
	axis_od SMALLINT UNSIGNED NULL,
	axis_os SMALLINT UNSIGNED NULL,
	pd DECIMAL(5,2) NULL,
	notes TEXT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_prescription_user FOREIGN KEY (user_id) REFERENCES `user`(id)
		ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	user_id BIGINT UNSIGNED NOT NULL,
	status ENUM('active', 'checked_out', 'abandoned') DEFAULT 'active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES `user`(id)
		ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cartitem (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	cart_id BIGINT UNSIGNED NOT NULL,
	productvariant_id BIGINT UNSIGNED NOT NULL,
	lens_id BIGINT UNSIGNED NULL,
	prescription_id BIGINT UNSIGNED NULL,
	quantity INT UNSIGNED NOT NULL DEFAULT 1,
	unit_price DECIMAL(12,2) NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_cartitem_cart FOREIGN KEY (cart_id) REFERENCES cart(id)
		ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT fk_cartitem_productvariant FOREIGN KEY (productvariant_id) REFERENCES productvariant(id)
		ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT fk_cartitem_lens FOREIGN KEY (lens_id) REFERENCES lens(id)
		ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT fk_cartitem_prescription FOREIGN KEY (prescription_id) REFERENCES prescription(id)
		ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `order` (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	user_id BIGINT UNSIGNED NOT NULL,
	promotion_id BIGINT UNSIGNED NULL,
	order_number VARCHAR(50) NOT NULL UNIQUE,
	total_amount DECIMAL(12,2) NOT NULL,
	discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
	shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
	status ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
	shipping_address TEXT NOT NULL,
	billing_address TEXT NULL,
	placed_at DATETIME NOT NULL,
	production_step ENUM('lens_cutting', 'frame_mounting', 'qc_inspection', 'packaging', 'ready_to_ship') NULL,
	verified_by BIGINT UNSIGNED NULL,
	verified_at TIMESTAMP NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES `user`(id)
		ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT fk_order_promotion FOREIGN KEY (promotion_id) REFERENCES promotion(id)
		ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT fk_order_verified_by FOREIGN KEY (verified_by) REFERENCES `user`(id)
		ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orderitem (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	order_id BIGINT UNSIGNED NOT NULL,
	productvariant_id BIGINT UNSIGNED NOT NULL,
	lens_id BIGINT UNSIGNED NULL,
	prescription_id BIGINT UNSIGNED NULL,
	quantity INT UNSIGNED NOT NULL,
	unit_price DECIMAL(12,2) NOT NULL,
	line_total DECIMAL(12,2) NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_orderitem_order FOREIGN KEY (order_id) REFERENCES `order`(id)
		ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT fk_orderitem_productvariant FOREIGN KEY (productvariant_id) REFERENCES productvariant(id)
		ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT fk_orderitem_lens FOREIGN KEY (lens_id) REFERENCES lens(id)
		ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT fk_orderitem_prescription FOREIGN KEY (prescription_id) REFERENCES prescription(id)
		ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payment (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	order_id BIGINT UNSIGNED NOT NULL,
	payment_method ENUM('cod', 'bank_transfer', 'card', 'e_wallet') NOT NULL,
	amount DECIMAL(12,2) NOT NULL,
	status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
	transaction_ref VARCHAR(120) NULL,
	paid_at DATETIME NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES `order`(id)
		ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shipment (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	order_id BIGINT UNSIGNED NOT NULL,
	courier VARCHAR(80) NULL,
	tracking_number VARCHAR(120) NULL UNIQUE,
	shipping_status ENUM('pending', 'packed', 'shipping', 'delivered', 'returned') DEFAULT 'pending',
	shipped_at DATETIME NULL,
	delivered_at DATETIME NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_shipment_order FOREIGN KEY (order_id) REFERENCES `order`(id)
		ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS supportticket (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	user_id BIGINT UNSIGNED NOT NULL,
	order_id BIGINT UNSIGNED NULL,
	subject VARCHAR(180) NOT NULL,
	message TEXT NOT NULL,
	status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
	priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_supportticket_user FOREIGN KEY (user_id) REFERENCES `user`(id)
		ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT fk_supportticket_order FOREIGN KEY (order_id) REFERENCES `order`(id)
		ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ticket_replies (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	ticket_id BIGINT UNSIGNED NOT NULL,
	user_id BIGINT UNSIGNED NOT NULL,
	message TEXT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_ticket_replies_ticket FOREIGN KEY (ticket_id) REFERENCES supportticket(id)
		ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT fk_ticket_replies_user FOREIGN KEY (user_id) REFERENCES `user`(id)
		ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS returnrequest (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	user_id BIGINT UNSIGNED NOT NULL,
	orderitem_id BIGINT UNSIGNED NOT NULL,
	reason TEXT NOT NULL,
	status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
	requested_at DATETIME NOT NULL,
	resolved_at DATETIME NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_returnrequest_user FOREIGN KEY (user_id) REFERENCES `user`(id)
		ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT fk_returnrequest_orderitem FOREIGN KEY (orderitem_id) REFERENCES orderitem(id)
		ON UPDATE CASCADE ON DELETE RESTRICT
);

SET @product_category_id_exists = (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
	  AND TABLE_NAME = 'product'
	  AND COLUMN_NAME = 'category_id'
);
SET @product_category_id_sql = IF(
	@product_category_id_exists = 0,
	'ALTER TABLE product ADD COLUMN category_id BIGINT UNSIGNED NULL',
	'DO 0'
);
PREPARE stmt_product_category_id FROM @product_category_id_sql;
EXECUTE stmt_product_category_id;
DEALLOCATE PREPARE stmt_product_category_id;

SET @product_model_name_exists = (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
	  AND TABLE_NAME = 'product'
	  AND COLUMN_NAME = 'model_name'
);
SET @product_model_name_sql = IF(
	@product_model_name_exists = 0,
	'ALTER TABLE product ADD COLUMN model_name VARCHAR(150) NULL',
	'DO 0'
);
PREPARE stmt_product_model_name FROM @product_model_name_sql;
EXECUTE stmt_product_model_name;
DEALLOCATE PREPARE stmt_product_model_name;

SET @variant_size_code_exists = (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
	  AND TABLE_NAME = 'productvariant'
	  AND COLUMN_NAME = 'size_code'
);
SET @variant_size_code_sql = IF(
	@variant_size_code_exists = 0,
	'ALTER TABLE productvariant ADD COLUMN size_code VARCHAR(60) NULL',
	'DO 0'
);
PREPARE stmt_variant_size_code FROM @variant_size_code_sql;
EXECUTE stmt_variant_size_code;
DEALLOCATE PREPARE stmt_variant_size_code;

SET @variant_stock_quantity_exists = (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
	  AND TABLE_NAME = 'productvariant'
	  AND COLUMN_NAME = 'stock_quantity'
);
SET @variant_stock_quantity_sql = IF(
	@variant_stock_quantity_exists = 0,
	'ALTER TABLE productvariant ADD COLUMN stock_quantity INT UNSIGNED NOT NULL DEFAULT 0',
	'DO 0'
);
PREPARE stmt_variant_stock_quantity FROM @variant_stock_quantity_sql;
EXECUTE stmt_variant_stock_quantity;
DEALLOCATE PREPARE stmt_variant_stock_quantity;

SET @variant_image_2d_exists = (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
	  AND TABLE_NAME = 'productvariant'
	  AND COLUMN_NAME = 'image_2d_url'
);
SET @variant_image_2d_sql = IF(
	@variant_image_2d_exists = 0,
	'ALTER TABLE productvariant ADD COLUMN image_2d_url VARCHAR(255) NULL',
	'DO 0'
);
PREPARE stmt_variant_image_2d FROM @variant_image_2d_sql;
EXECUTE stmt_variant_image_2d;
DEALLOCATE PREPARE stmt_variant_image_2d;

SET @variant_model_3d_exists = (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
	  AND TABLE_NAME = 'productvariant'
	  AND COLUMN_NAME = 'model_3d_url'
);
SET @variant_model_3d_sql = IF(
	@variant_model_3d_exists = 0,
	'ALTER TABLE productvariant ADD COLUMN model_3d_url VARCHAR(255) NULL',
	'DO 0'
);
PREPARE stmt_variant_model_3d FROM @variant_model_3d_sql;
EXECUTE stmt_variant_model_3d;
DEALLOCATE PREPARE stmt_variant_model_3d;

SET @variant_additional_price_exists = (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
	  AND TABLE_NAME = 'productvariant'
	  AND COLUMN_NAME = 'additional_price'
);
SET @variant_additional_price_sql = IF(
	@variant_additional_price_exists = 0,
	'ALTER TABLE productvariant ADD COLUMN additional_price DECIMAL(12,2) NOT NULL DEFAULT 0.00',
	'DO 0'
);
PREPARE stmt_variant_additional_price FROM @variant_additional_price_sql;
EXECUTE stmt_variant_additional_price;
DEALLOCATE PREPARE stmt_variant_additional_price;

SET @lens_type_exists = (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
	  AND TABLE_NAME = 'lens'
	  AND COLUMN_NAME = 'type'
);
SET @lens_type_sql = IF(
	@lens_type_exists = 0,
	'ALTER TABLE lens ADD COLUMN type ENUM(''single_vision'', ''bifocal'', ''progressive'') NULL',
	'DO 0'
);
PREPARE stmt_lens_type FROM @lens_type_sql;
EXECUTE stmt_lens_type;
DEALLOCATE PREPARE stmt_lens_type;

SET @lens_material_exists = (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
	  AND TABLE_NAME = 'lens'
	  AND COLUMN_NAME = 'material'
);
SET @lens_material_sql = IF(
	@lens_material_exists = 0,
	'ALTER TABLE lens ADD COLUMN material VARCHAR(120) NULL',
	'DO 0'
);
PREPARE stmt_lens_material FROM @lens_material_sql;
EXECUTE stmt_lens_material;
DEALLOCATE PREPARE stmt_lens_material;

ALTER TABLE lens
	MODIFY COLUMN lens_type VARCHAR(80) NULL;

UPDATE productvariant
SET stock_quantity = 0
WHERE stock_quantity IS NULL;

SET @fk_product_category_exists = (
	SELECT COUNT(*)
	FROM information_schema.TABLE_CONSTRAINTS
	WHERE CONSTRAINT_SCHEMA = DATABASE()
	  AND TABLE_NAME = 'product'
	  AND CONSTRAINT_NAME = 'fk_product_category'
);
SET @fk_product_category_sql = IF(
	@fk_product_category_exists = 0,
	'ALTER TABLE product ADD CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES category(id) ON UPDATE CASCADE ON DELETE SET NULL',
	'DO 0'
);
PREPARE stmt_fk_product_category FROM @fk_product_category_sql;
EXECUTE stmt_fk_product_category;
DEALLOCATE PREPARE stmt_fk_product_category;
