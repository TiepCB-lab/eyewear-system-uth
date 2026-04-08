<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
	protected $table = 'product';

	protected $fillable = [
		'category_id',
		'name',
		'model_name',
		'slug',
		'description',
		'base_price',
		'brand',
		'gender',
		'is_active',
	];

	protected $casts = [
		'base_price' => 'decimal:2',
		'is_active' => 'boolean',
	];

	public function category()
	{
		return $this->belongsTo(Category::class, 'category_id');
	}

	public function variants()
	{
		return $this->hasMany(ProductVariant::class, 'product_id');
	}

	public function scopeActive($query)
	{
		return $query->where('is_active', true);
	}

	public function scopeCategory($query, $categoryId)
	{
		if ($categoryId === null || $categoryId === '') {
			return $query;
		}

		return $query->where('category_id', $categoryId);
	}

	public function scopeBrand($query, ?string $brand)
	{
		if ($brand === null || $brand === '') {
			return $query;
		}

		return $query->where('brand', $brand);
	}

	public function scopeGender($query, ?string $gender)
	{
		if ($gender === null || $gender === '' || $gender === 'all') {
			return $query;
		}

		return $query->where('gender', $gender);
	}

	public function scopeSearch($query, ?string $term)
	{
		$term = trim((string) $term);

		if ($term === '') {
			return $query;
		}

		return $query->where(function ($subQuery) use ($term) {
			$subQuery->where('name', 'like', '%' . $term . '%')
				->orWhere('model_name', 'like', '%' . $term . '%')
				->orWhere('slug', 'like', '%' . $term . '%')
				->orWhere('brand', 'like', '%' . $term . '%');
		});
	}

	public function scopeMaxPrice($query, $maxPrice)
	{
		if ($maxPrice === null || $maxPrice === '') {
			return $query;
		}

		return $query->where('base_price', '<=', $maxPrice);
	}

	public function scopePriceBetween($query, $minPrice = null, $maxPrice = null)
	{
		if ($minPrice !== null && $minPrice !== '') {
			$query->where('base_price', '>=', $minPrice);
		}

		if ($maxPrice !== null && $maxPrice !== '') {
			$query->where('base_price', '<=', $maxPrice);
		}

		return $query;
	}

	public function scopeFilter($query, array $filters = [])
	{
		return $query
			->category($filters['category_id'] ?? null)
			->brand($filters['brand'] ?? null)
			->gender($filters['gender'] ?? null)
			->search($filters['search'] ?? null)
			->priceBetween($filters['min_price'] ?? null, $filters['max_price'] ?? null)
			->when(array_key_exists('active', $filters), function ($subQuery) use ($filters) {
				return $filters['active'] ? $subQuery->active() : $subQuery;
			});
	}
}

