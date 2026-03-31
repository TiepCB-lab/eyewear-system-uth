<?php
header('Content-Type: application/json');

echo json_content_response([
    "status" => "success",
    "message" => "Eyewear System UTH Backend API is live",
    "architecture" => "N-Layered PHP",
    "supported_v1_endpoints" => [
        "/auth",
        "/catalog",
        "/cart",
        "/checkout",
        "/ops"
    ]
]);

// Helper function mock
function json_content_response($data) {
    return json_encode([
        "data" => $data,
        "timestamp" => date("Y-m-d H:i:s")
    ], JSON_PRETTY_PRINT);
}
