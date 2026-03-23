<?php

namespace App\Domain\Shared;

enum RoleName: string
{
    // TODO: [M1-IDENTITY] Define role cases
    case ADMIN = 'admin';
    case MANAGER = 'manager';
    case SALES = 'sales';
    case OPERATIONS = 'operations';
    case CUSTOMER = 'customer';
}
