<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
	protected $fillable = [
		'order_id',
		'carrier',
		'tracking_code',
		'status',
		'shipped_at',
		'delivered_at',
	];

	protected $casts = [
		'order_id' => 'integer',
		'shipped_at' => 'datetime',
		'delivered_at' => 'datetime',
	];

	public function order()
	{
		return $this->belongsTo(Order::class);
	}
}

