<?php

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$file = __DIR__ . $uri;

if ($uri !== '/favicon.ico' && file_exists($file) && is_file($file)) {
    return false;
}

require_once __DIR__ . '/public/index.php';
