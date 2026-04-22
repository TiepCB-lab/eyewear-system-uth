<?php
include 'dp.php';

function loadFrontendUrl(): string
{
    $envPaths = [__DIR__ . '/.env.local', __DIR__ . '/.env'];

    foreach ($envPaths as $envPath) {
        if (!is_file($envPath)) {
            continue;
        }

        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            continue;
        }

        foreach ($lines as $line) {
            if (str_starts_with(trim($line), 'FRONTEND_URL=')) {
                [, $value] = explode('=', $line, 2);
                $frontendUrl = rtrim(trim($value, " \t\n\r\0\x0B\"'"), '/');
                return preg_replace('#/frontend$#', '', $frontendUrl) ?? $frontendUrl;
            }
        }
    }

    return 'http://localhost:5500';
}

$frontendUrl = loadFrontendUrl();

if (isset($_GET['token']) && !empty($_GET['token'])) {
    $token = $_GET['token'];

    $check = $conn->prepare("SELECT id FROM `user` WHERE verify_token = ?");
    $check->execute([$token]);

    if ($check->rowCount() > 0) {
        $sql = "UPDATE `user` SET status = 'active', verify_token = NULL WHERE verify_token = ?";
        $conn->prepare($sql)->execute([$token]);

        header('Location: ' . $frontendUrl . '/pages/auth/?verified=1');
        exit;
    }

    header('Location: ' . $frontendUrl . '/pages/auth/?verified=0&error=' . urlencode('Mã xác thực không hợp lệ hoặc đã hết hạn.'));
    exit;
}

header('Location: ' . $frontendUrl . '/pages/auth/?verified=0&error=' . urlencode('Không tìm thấy mã xác thực!'));
exit;