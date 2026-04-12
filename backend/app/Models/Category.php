<?php

namespace App\Models;

use Core\Model;

class Category extends Model
{
	protected static string $table = 'category';

	public function products()
	{
		return Product::where('category_id', $this->id);
	}
}
