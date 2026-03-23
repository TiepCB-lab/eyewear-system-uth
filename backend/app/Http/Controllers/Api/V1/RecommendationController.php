<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Routing\Controller;

class RecommendationController extends Controller
{
    // TODO: [M3-SHOPPING] POST /api/v1/recommendation/face-shape -> analyzeFaceShape(Request) -> upload image, return shape
    // TODO: [M3-SHOPPING] GET  /api/v1/recommendation/suggest?shape= -> suggestFrames(Request) -> frames matching face shape
    // TODO: [M3-SHOPPING] POST /api/v1/recommendation/virtual-try-on -> virtualTryOn(Request) -> overlay frame on face image
}
