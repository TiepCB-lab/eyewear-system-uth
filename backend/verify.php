<?php
include 'dp.php'; // Sửa thành dp.php

// Kiểm tra xem trên link có cái ?token= hay không
if (isset($_GET['token']) && !empty($_GET['token'])) {
    $token = $_GET['token'];

    // 1. Kiểm tra xem token này có thực sự tồn tại trong bảng accounts không
    $check = $conn->prepare("SELECT id FROM `user` WHERE verify_token = ?");
    $check->execute([$token]);
    
    if ($check->rowCount() > 0) {
        // 2. Nếu có thì mới cập nhật status
        $sql = "UPDATE `user` SET status = 'active', verify_token = NULL WHERE verify_token = ?";
        $conn->prepare($sql)->execute([$token]);
        
        header('Location: http://127.0.0.1:5500/frontend/src/pages/auth/?verified=1');
        exit;
    } else {
        header('Location: http://127.0.0.1:5500/frontend/src/pages/auth/?verified=0&error=' . urlencode('Mã xác thực không hợp lệ hoặc đã hết hạn.'));
        exit;
    }
} else {
    header('Location: http://127.0.0.1:5500/frontend/src/pages/auth/?verified=0&error=' . urlencode('Không tìm thấy mã xác thực!'));
    exit;
}
?>