<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Routing\Controller;

class ProductCatalogController extends Controller
{
    // TODO: [M2-CATALOG] GET  /api/v1/products -> index(ProductFilterRequest) with pagination, filter, sort
    // TODO: [M2-CATALOG] GET  /api/v1/products/{slug} -> show($slug) with variants, inventory
    // TODO: [M2-CATALOG] GET  /api/v1/products/{slug}/variants -> variants($slug)
    // TODO: [M2-CATALOG] GET  /api/v1/lenses -> listLenses() with feature filter
    // TODO: [M2-CATALOG] GET  /api/v1/lenses/compatible?sph=&cyl= -> compatibleLenses(Request)
}
