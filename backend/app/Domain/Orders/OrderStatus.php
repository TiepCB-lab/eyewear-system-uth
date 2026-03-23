<?php

namespace App\Domain\Orders;

enum OrderStatus: string
{
    // TODO: [M3-SHOPPING] Implement full lifecycle
    case PENDING = 'pending';
    case PENDING_VERIFICATION = 'pending_verification';
    case VERIFIED = 'verified';
    case IN_PRODUCTION = 'in_production';
    case QC_PASSED = 'qc_passed';
    case PACKAGING = 'packaging';
    case SHIPPED = 'shipped';
    case DELIVERED = 'delivered';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case REJECTED = 'rejected';
}
