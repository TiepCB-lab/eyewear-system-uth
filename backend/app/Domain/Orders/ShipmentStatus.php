<?php

namespace App\Domain\Orders;

enum ShipmentStatus: string
{
    case PREPARING = 'preparing';
    case SHIPPED = 'shipped';
    case IN_TRANSIT = 'in_transit';
    case DELIVERED = 'delivered';
    case FAILED = 'failed';
}
