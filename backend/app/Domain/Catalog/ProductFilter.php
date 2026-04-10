<?php

namespace App\Domain\Catalog;

use Illuminate\Database\Eloquent\Builder;

class ProductFilter
{
    public function applyFilters(Builder $query, array $filters = []): Builder
    {
        $this->applyCategoryFilter($query, $filters['category_id'] ?? $filters['category'] ?? null);
        $this->applyBrandFilter($query, $filters['brand'] ?? $filters['brands'] ?? null);
        $this->applyGenderFilter($query, $filters['gender'] ?? null);
        $this->applyPriceRangeFilter(
            $query,
            $filters['min_price'] ?? $filters['price_min'] ?? null,
            $filters['max_price'] ?? $filters['price_max'] ?? null
        );

        return $query;
    }

    public function applyCategoryFilter(Builder $query, $category): Builder
    {
        if ($category === null || $category === '') {
            return $query;
        }

        if (is_array($category)) {
            $categoryIds = array_values(array_filter($category, static function ($value) {
                return $value !== null && $value !== '';
            }));

            if (!empty($categoryIds)) {
                $query->whereIn('category_id', $categoryIds);
            }

            return $query;
        }

        return $query->where('category_id', $category);
    }

    public function applyBrandFilter(Builder $query, $brand): Builder
    {
        if ($brand === null || $brand === '') {
            return $query;
        }

        if (is_array($brand)) {
            $brands = array_values(array_filter($brand, static function ($value) {
                return is_string($value) && trim($value) !== '';
            }));

            if (!empty($brands)) {
                $query->whereIn('brand', $brands);
            }

            return $query;
        }

        $brand = trim((string) $brand);
        if ($brand === '') {
            return $query;
        }

        return $query->where('brand', $brand);
    }

    public function applyGenderFilter(Builder $query, $gender): Builder
    {
        if ($gender === null || $gender === '' || $gender === 'all') {
            return $query;
        }

        if (is_array($gender)) {
            $genders = array_values(array_filter($gender, static function ($value) {
                if (!is_string($value)) {
                    return false;
                }

                $normalized = strtolower(trim($value));
                return $normalized !== '' && $normalized !== 'all';
            }));

            if (!empty($genders)) {
                $query->whereIn('gender', $genders);
            }

            return $query;
        }

        return $query->where('gender', strtolower(trim((string) $gender)));
    }

    public function applyPriceRangeFilter(Builder $query, $minPrice = null, $maxPrice = null): Builder
    {
        $min = $this->toNumber($minPrice);
        $max = $this->toNumber($maxPrice);

        if ($min !== null && $max !== null && $min > $max) {
            [$min, $max] = [$max, $min];
        }

        if ($min !== null) {
            $query->where('base_price', '>=', $min);
        }

        if ($max !== null) {
            $query->where('base_price', '<=', $max);
        }

        return $query;
    }

    private function toNumber($value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            return (float) $value;
        }

        return null;
    }
}
