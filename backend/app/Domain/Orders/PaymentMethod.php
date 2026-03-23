<?php

namespace App\Domain\Orders;

enum PaymentMethod: string
{
    case COD = 'cod';
    case VNPAY = 'vnpay';
}
