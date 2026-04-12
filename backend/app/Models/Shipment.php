<?php

namespace App\Models;

use Core\Model;

class Shipment extends Model
{
	protected static string $table = 'shipment';

	public function order()
	{
		return Order::find($this->order_id);
	}
}
