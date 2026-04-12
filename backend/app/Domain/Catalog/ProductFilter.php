<?php

namespace App\Domain\Catalog;

use Core\Database;

/**
 * ProductFilter — Builds and executes filtered product queries using pure SQL.
 *
 * Replaces the previous Eloquent Builder-based implementation.
 */
class ProductFilter
{
    /**
     * Apply all provided filters and return the SQL conditions + params.
     * 
     * @return array{sql: string, params: array}
     */
    public function buildFilterQuery(array $filters = []): array
    {
        $conditions = [];
        $params = [];

        // Category filter
        if (!empty($filters['category_id'])) {
            if (is_array($filters['category_id'])) {
                $placeholders = implode(',', array_fill(0, count($filters['category_id']), '?'));
                $conditions[] = "p.category_id IN ({$placeholders})";
                $params = array_merge($params, $filters['category_id']);
            } else {
                $conditions[] = "p.category_id = ?";
                $params[] = $filters['category_id'];
            }
        }

        // Brand filter
        $brand = $filters['brand'] ?? $filters['brands'] ?? null;
        if (!empty($brand)) {
            if (is_array($brand)) {
                $placeholders = implode(',', array_fill(0, count($brand), '?'));
                $conditions[] = "p.brand IN ({$placeholders})";
                $params = array_merge($params, $brand);
            } else {
                $conditions[] = "p.brand = ?";
                $params[] = $brand;
            }
        }

        // Gender filter
        if (!empty($filters['gender']) && $filters['gender'] !== 'all') {
            if (is_array($filters['gender'])) {
                $placeholders = implode(',', array_fill(0, count($filters['gender']), '?'));
                $conditions[] = "p.gender IN ({$placeholders})";
                $params = array_merge($params, $filters['gender']);
            } else {
                $conditions[] = "p.gender = ?";
                $params[] = strtolower(trim($filters['gender']));
            }
        }

        // Price range filter
        $minPrice = $filters['min_price'] ?? $filters['price_min'] ?? null;
        $maxPrice = $filters['max_price'] ?? $filters['price_max'] ?? null;

        if ($minPrice !== null && $minPrice !== '' && is_numeric($minPrice)) {
            $conditions[] = "p.base_price >= ?";
            $params[] = (float)$minPrice;
        }
        if ($maxPrice !== null && $maxPrice !== '' && is_numeric($maxPrice)) {
            $conditions[] = "p.base_price <= ?";
            $params[] = (float)$maxPrice;
        }

        // Search filter
        $search = $filters['search'] ?? null;
        if (!empty($search) && trim($search) !== '') {
            $term = '%' . trim($search) . '%';
            $conditions[] = "(p.name LIKE ? OR p.model_name LIKE ? OR p.slug LIKE ? OR p.brand LIKE ?)";
            $params = array_merge($params, [$term, $term, $term, $term]);
        }

        // Active filter
        if (isset($filters['active']) && $filters['active']) {
            $conditions[] = "p.is_active = 1";
        }

        $sql = '';
        if (!empty($conditions)) {
            $sql = ' WHERE ' . implode(' AND ', $conditions);
        }

        return ['sql' => $sql, 'params' => $params];
    }

    /**
     * Fetch filtered products from the database.
     */
    public function getFilteredProducts(array $filters = []): array
    {
        $db = Database::getInstance();
        $filterResult = $this->buildFilterQuery($filters);

        $sql = "SELECT p.*, c.name as category_name 
                FROM product p 
                LEFT JOIN category c ON p.category_id = c.id" 
                . $filterResult['sql'] 
                . " ORDER BY p.created_at DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($filterResult['params']);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}
