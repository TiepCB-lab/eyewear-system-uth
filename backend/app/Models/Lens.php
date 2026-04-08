<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lens extends Model
{
	protected $table = 'lens';

	protected $fillable = [
		'name',
		'type',
		'lens_type',
		'material',
		'index_value',
		'coating',
		'price',
	];

	protected $casts = [
		'index_value' => 'decimal:2',
		'price' => 'decimal:2',
	];

	public function cartItems()
	{
		return $this->hasMany(CartItem::class, 'lens_id');
	}

	public function orderItems()
	{
		return $this->hasMany(OrderItem::class, 'lens_id');
	}
}

