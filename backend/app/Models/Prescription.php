<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    // TODO: [M1-IDENTITY] Define $fillable: user_id, name, left_sph, left_cyl, left_axis, right_sph, right_cyl, right_axis, pd, note, image_url
    // TODO: [M1-IDENTITY] Relationship: belongsTo(User::class)
    // TODO: [M1-IDENTITY] Accessor: getFormattedLeftEye() -> "SPH: -2.00, CYL: -0.75, AXIS: 180"
    // TODO: [M1-IDENTITY] Accessor: getFormattedRightEye()
}
