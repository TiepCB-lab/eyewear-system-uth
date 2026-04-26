<?php

namespace App\Application;

use Core\Database;

class CatalogService
{
	public function searchProducts(array $params = []): array
	{
		$db = Database::getInstance();
		$filters = $this->normalizeFilters($params);

		[$whereSql, $bindings] = $this->buildProductWhereClause($filters);

		$totalSql = 'SELECT COUNT(DISTINCT p.id) AS total FROM product p ' . $whereSql;
		$totalStmt = $db->prepare($totalSql);
		$totalStmt->execute($bindings);
		$total = (int) ($totalStmt->fetch()['total'] ?? 0);

		$offset = ($filters['page'] - 1) * $filters['per_page'];
		$dataSql = 'SELECT
				p.id,
				p.category_id,
				c.name AS category_name,
				c.slug AS category_slug,
				p.name,
				p.model_name,
				p.slug,
				p.description,
				p.base_price,
				p.brand,
				p.gender,
				p.is_active,
				MIN(COALESCE(v.price_override, p.base_price + v.additional_price, p.base_price)) AS min_price,
				MAX(COALESCE(v.price_override, p.base_price + v.additional_price, p.base_price)) AS max_price,
				COALESCE(SUM(v.stock_quantity), 0) AS total_stock,
				COUNT(v.id) AS variant_count,
				(
					SELECT image_2d_url
					FROM productvariant v2
					WHERE v2.product_id = p.id
					ORDER BY COALESCE(v2.price_override, p.base_price + v2.additional_price, p.base_price) ASC, v2.id ASC
					LIMIT 1
				) AS thumbnail,
				(
					SELECT id
					FROM productvariant v2
					WHERE v2.product_id = p.id
					ORDER BY COALESCE(v2.price_override, p.base_price + v2.additional_price, p.base_price) ASC, v2.id ASC
					LIMIT 1
				) AS first_variant_id
			FROM product p
			LEFT JOIN category c ON c.id = p.category_id
			LEFT JOIN productvariant v ON v.product_id = p.id
			' . $whereSql . '
			GROUP BY p.id, p.category_id, c.name, c.slug, p.name, p.model_name, p.slug, p.description, p.base_price, p.brand, p.gender, p.is_active
			ORDER BY ' . $filters['sort_by'] . ' ' . $filters['sort_direction'] . ', p.id DESC
			LIMIT ' . (int) $filters['per_page'] . ' OFFSET ' . (int) $offset;

		$dataStmt = $db->prepare($dataSql);
		$dataStmt->execute($bindings);
		$rows = $dataStmt->fetchAll() ?: [];

		$items = array_map(function (array $row): array {
			$basePrice = (float) $row['base_price'];
			$minPrice = $row['min_price'] !== null ? (float) $row['min_price'] : $basePrice;
			$maxPrice = $row['max_price'] !== null ? (float) $row['max_price'] : $basePrice;

			return [
				'id' => (int) $row['id'],
				'category' => $row['category_id'] !== null ? [
					'id' => (int) $row['category_id'],
					'name' => $row['category_name'],
					'slug' => $row['category_slug'],
				] : null,
				'name' => $row['name'],
				'model_name' => $row['model_name'],
				'slug' => $row['slug'],
				'description' => $row['description'],
				'base_price' => $basePrice,
				'price_range' => [
					'min' => $minPrice,
					'max' => $maxPrice,
				],
				'brand' => $row['brand'],
				'gender' => $row['gender'],
				'is_active' => (bool) $row['is_active'],
				'variant_count' => (int) $row['variant_count'],
				'total_stock' => (int) $row['total_stock'],
				'in_stock' => ((int) $row['total_stock']) > 0,
				'thumbnail' => $row['thumbnail'],
				'first_variant_id' => $row['first_variant_id'] ? (int) $row['first_variant_id'] : null,
			];
		}, $rows);

		return [
			'data' => $items,
			'pagination' => [
				'page' => $filters['page'],
				'per_page' => $filters['per_page'],
				'total' => $total,
				'total_pages' => $filters['per_page'] > 0 ? (int) ceil($total / $filters['per_page']) : 0,
			],
			'filters' => [
				'search' => $filters['search'],
				'category_ids' => $filters['category_ids'],
				'brands' => $filters['brands'],
				'genders' => $filters['genders'],
				'min_price' => $filters['min_price'],
				'max_price' => $filters['max_price'],
				'active_only' => $filters['active_only'],
				'sort_by' => $filters['sort_by'],
				'sort_direction' => $filters['sort_direction'],
			],
		];
	}

	public function getProductDetails(int|string $idOrSlug): ?array
	{
		$db = Database::getInstance();

		$isNumericId = is_int($idOrSlug) || ctype_digit((string) $idOrSlug);
		$productSql = 'SELECT
				p.id,
				p.category_id,
				c.name AS category_name,
				c.slug AS category_slug,
				p.name,
				p.model_name,
				p.slug,
				p.description,
				p.base_price,
				p.brand,
				p.gender,
				p.is_active,
				p.created_at,
				p.updated_at
			FROM product p
			LEFT JOIN category c ON c.id = p.category_id
			WHERE ' . ($isNumericId ? 'p.id = ?' : 'p.slug = ?') . '
			LIMIT 1';

		$productStmt = $db->prepare($productSql);
		$productStmt->execute([$isNumericId ? (int) $idOrSlug : trim((string) $idOrSlug)]);
		$product = $productStmt->fetch();

		if (!$product) {
			return null;
		}

		$variantSql = 'SELECT
				id,
				product_id,
				sku,
				color,
				size_code,
				size,
				stock_quantity,
				image_2d_url,
				model_3d_url,
				additional_price,
				price_override,
				created_at,
				updated_at
			FROM productvariant
			WHERE product_id = ?
			ORDER BY COALESCE(price_override, ? + additional_price, ?) ASC, id ASC';

		$basePrice = (float) $product['base_price'];
		$variantStmt = $db->prepare($variantSql);
		$variantStmt->execute([(int) $product['id'], $basePrice, $basePrice]);
		$variantRows = $variantStmt->fetchAll() ?: [];

		$variants = array_map(function (array $variant) use ($basePrice): array {
			$priceOverride = $variant['price_override'] !== null ? (float) $variant['price_override'] : null;
			$additionalPrice = (float) $variant['additional_price'];
			$effectivePrice = $priceOverride ?? ($basePrice + $additionalPrice);

			return [
				'id' => (int) $variant['id'],
				'product_id' => (int) $variant['product_id'],
				'sku' => $variant['sku'],
				'color' => $variant['color'],
				'size_code' => $variant['size_code'],
				'size' => $variant['size'],
				'stock_quantity' => (int) $variant['stock_quantity'],
				'in_stock' => ((int) $variant['stock_quantity']) > 0,
				'image_2d_url' => $variant['image_2d_url'],
				'model_3d_url' => $variant['model_3d_url'],
				'additional_price' => $additionalPrice,
				'price_override' => $priceOverride,
				'effective_price' => $effectivePrice,
				'created_at' => $variant['created_at'],
				'updated_at' => $variant['updated_at'],
			];
		}, $variantRows);

		$priceCandidates = array_map(static function (array $variant): float {
			return (float) $variant['effective_price'];
		}, $variants);
		if (empty($priceCandidates)) {
			$priceCandidates = [$basePrice];
		}

		$totalStock = array_reduce($variants, static function (int $carry, array $variant): int {
			return $carry + (int) $variant['stock_quantity'];
		}, 0);

		return [
			'id' => (int) $product['id'],
			'category' => $product['category_id'] !== null ? [
				'id' => (int) $product['category_id'],
				'name' => $product['category_name'],
				'slug' => $product['category_slug'],
			] : null,
			'name' => $product['name'],
			'model_name' => $product['model_name'],
			'slug' => $product['slug'],
			'description' => $product['description'],
			'base_price' => $basePrice,
			'price_range' => [
				'min' => min($priceCandidates),
				'max' => max($priceCandidates),
			],
			'brand' => $product['brand'],
			'gender' => $product['gender'],
			'is_active' => (bool) $product['is_active'],
			'variants' => $variants,
			'variant_count' => count($variants),
			'total_stock' => $totalStock,
			'in_stock' => $totalStock > 0,
			'created_at' => $product['created_at'],
			'updated_at' => $product['updated_at'],
		];
	}

	public function getCategoriesList(bool $activeOnly = true): array
	{
		$db = Database::getInstance();

		$sql = 'SELECT
				c.id,
				c.name,
				c.slug,
				c.description,
				COUNT(p.id) AS product_count,
				COALESCE(SUM(CASE WHEN p.is_active = 1 THEN 1 ELSE 0 END), 0) AS active_product_count
			FROM category c
			LEFT JOIN product p ON p.category_id = c.id
			GROUP BY c.id, c.name, c.slug, c.description
			ORDER BY c.name ASC';

		$stmt = $db->prepare($sql);
		$stmt->execute();
		$rows = $stmt->fetchAll() ?: [];

		$categories = array_map(static function (array $row): array {
			return [
				'id' => (int) $row['id'],
				'name' => $row['name'],
				'slug' => $row['slug'],
				'description' => $row['description'],
				'product_count' => (int) $row['product_count'],
				'active_product_count' => (int) $row['active_product_count'],
			];
		}, $rows);

		if (!$activeOnly) {
			return $categories;
		}

		return array_values(array_filter($categories, static function (array $category): bool {
			return $category['active_product_count'] > 0;
		}));
	}

	public function getBrandsList(): array
	{
		$db = Database::getInstance();
		$sql = 'SELECT DISTINCT brand FROM product WHERE brand IS NOT NULL AND brand != "" ORDER BY brand ASC';
		$stmt = $db->prepare($sql);
		$stmt->execute();
		return $stmt->fetchAll(\PDO::FETCH_COLUMN) ?: [];
	}

	private function normalizeFilters(array $params): array
	{
		$page = max(1, (int) ($params['page'] ?? 1));
		$perPage = (int) ($params['per_page'] ?? 12);
		$perPage = max(1, min(100, $perPage));

		$search = trim((string) ($params['search'] ?? $params['q'] ?? ''));
		$categoryIds = $this->normalizeIntList($params['category_ids'] ?? $params['category_id'] ?? $params['category'] ?? []);
		$brands = $this->normalizeStringList($params['brands'] ?? $params['brand'] ?? []);
		$genders = $this->normalizeStringList($params['genders'] ?? $params['gender'] ?? []);
		$genders = array_values(array_filter($genders, static function (string $gender): bool {
			return $gender !== 'all';
		}));

		$minPrice = $this->toFloatOrNull($params['min_price'] ?? $params['price_min'] ?? null);
		$maxPrice = $this->toFloatOrNull($params['max_price'] ?? $params['price_max'] ?? null);
		if ($minPrice !== null && $maxPrice !== null && $minPrice > $maxPrice) {
			[$minPrice, $maxPrice] = [$maxPrice, $minPrice];
		}

		$activeOnly = !array_key_exists('active', $params) || (bool) $params['active'];

		$sortByMap = [
			'created_at' => 'p.created_at',
			'name' => 'p.name',
			'base_price' => 'p.base_price',
			'price' => 'min_price',
			'brand' => 'p.brand',
		];
		$sortByInput = strtolower((string) ($params['sort_by'] ?? 'created_at'));
		$sortBy = $sortByMap[$sortByInput] ?? 'p.created_at';

		$sortDirectionInput = strtoupper((string) ($params['sort_direction'] ?? $params['sort_dir'] ?? 'DESC'));
		$sortDirection = $sortDirectionInput === 'ASC' ? 'ASC' : 'DESC';

		return [
			'page' => $page,
			'per_page' => $perPage,
			'search' => $search,
			'category_ids' => $categoryIds,
			'brands' => $brands,
			'genders' => $genders,
			'min_price' => $minPrice,
			'max_price' => $maxPrice,
			'active_only' => $activeOnly,
			'sort_by' => $sortBy,
			'sort_direction' => $sortDirection,
		];
	}

	private function buildProductWhereClause(array $filters): array
	{
		$conditions = [];
		$bindings = [];

		if ($filters['active_only']) {
			$conditions[] = 'p.is_active = 1';
		}

		if ($filters['search'] !== '') {
			$conditions[] = '(p.name LIKE ? OR p.model_name LIKE ? OR p.slug LIKE ? OR p.brand LIKE ?)';
			$searchPattern = '%' . $filters['search'] . '%';
			$bindings[] = $searchPattern;
			$bindings[] = $searchPattern;
			$bindings[] = $searchPattern;
			$bindings[] = $searchPattern;
		}

		if (!empty($filters['category_ids'])) {
			$placeholders = implode(', ', array_fill(0, count($filters['category_ids']), '?'));
			$conditions[] = 'p.category_id IN (' . $placeholders . ')';
			foreach ($filters['category_ids'] as $categoryId) {
				$bindings[] = $categoryId;
			}
		}

		if (!empty($filters['brands'])) {
			$placeholders = implode(', ', array_fill(0, count($filters['brands']), '?'));
			$conditions[] = 'p.brand IN (' . $placeholders . ')';
			foreach ($filters['brands'] as $brand) {
				$bindings[] = $brand;
			}
		}

		if (!empty($filters['genders'])) {
			$placeholders = implode(', ', array_fill(0, count($filters['genders']), '?'));
			$conditions[] = 'p.gender IN (' . $placeholders . ')';
			foreach ($filters['genders'] as $gender) {
				$bindings[] = $gender;
			}
		}

		if ($filters['min_price'] !== null) {
			$conditions[] = 'p.base_price >= ?';
			$bindings[] = $filters['min_price'];
		}

		if ($filters['max_price'] !== null) {
			$conditions[] = 'p.base_price <= ?';
			$bindings[] = $filters['max_price'];
		}

		if (empty($conditions)) {
			return ['', $bindings];
		}

		return ['WHERE ' . implode(' AND ', $conditions), $bindings];
	}

	private function normalizeIntList($value): array
	{
		$list = is_array($value) ? $value : explode(',', (string) $value);
		$result = [];

		foreach ($list as $item) {
			if ($item === null || $item === '') {
				continue;
			}

			if (is_numeric($item)) {
				$intValue = (int) $item;
				if ($intValue > 0) {
					$result[] = $intValue;
				}
			}
		}

		return array_values(array_unique($result));
	}

	private function normalizeStringList($value): array
	{
		$list = is_array($value) ? $value : explode(',', (string) $value);
		$result = [];

		foreach ($list as $item) {
			if (!is_string($item) && !is_numeric($item)) {
				continue;
			}

			$normalized = strtolower(trim((string) $item));
			if ($normalized === '') {
				continue;
			}

			$result[] = $normalized;
		}

		return array_values(array_unique($result));
	}

	private function toFloatOrNull($value): ?float
	{
		if ($value === null || $value === '') {
			return null;
		}

		if (!is_numeric($value)) {
			return null;
		}

		return (float) $value;
	}
}
