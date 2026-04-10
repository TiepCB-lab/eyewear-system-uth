<?php

namespace App\Domain\Orders;

final class ShipmentStatus
{
    public const PENDING = 'pending';
    public const IN_TRANSIT = 'in_transit';
    public const DELIVERED = 'delivered';
    public const RETURNED = 'returned';

    public static function values(): array
    {
        return [
            self::PENDING,
            self::IN_TRANSIT,
            self::DELIVERED,
            self::RETURNED,
        ];
    }
}
