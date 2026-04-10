<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'total_amount',
        'status',
        'payment_status',
        'production_step',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'verified_by' => 'integer',
        'verified_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function shipment()
    {
        return $this->hasOne(Shipment::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function scopeInProduction(Builder $query): Builder
    {
        return $query->whereIn('production_step', [
            'lens_cutting',
            'frame_mounting',
            'qc_inspection',
            'packaging',
        ]);
    }

    public function scopeReadyToShip(Builder $query): Builder
    {
        return $query->where('production_step', 'ready_to_ship');
    }
}
