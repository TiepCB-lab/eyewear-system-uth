<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lens extends Model
{
    // TODO: [M2-CATALOG] Define $fillable: name, index_value, material, features, min_sph, max_sph, min_cyl, max_cyl, price, is_active
    // TODO: [M2-CATALOG] features should be JSON cast (blue_light, photochromic, anti_scratch, etc.)
    // TODO: [M2-CATALOG] Method: isCompatibleWith(Prescription $rx): bool -> check sph/cyl limits
}
