<?php
session_start();
include 'dp.php'; // Đã sửa từ db thành dp

if (isset($_POST['login'])) {
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Truy vấn bảng accounts
    $stmt = $conn->prepare("SELECT * FROM accounts WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // 1. Kiểm tra user có tồn tại và mật khẩu có đúng không
    // Lưu ý: đổi thành $user['password_hash'] cho khớp với database
    if ($user && password_verify($password, $user['password_hash'])) {
        
        // 2. Kiểm tra trạng thái xác thực mail
        if ($user['status'] == 0) {
            die("Tài khoản này chưa được xác thực email. Vui lòng kiểm tra hộp thư!");
        }

        // 3. Đăng nhập thành công, lưu thông tin vào Session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['full_name'] = $user['full_name'];
        $_SESSION['role_id'] = $user['role_id'];

        // 4. Phân quyền hướng trang (1 là Admin, 2 là User)
        if ($user['role_id'] == 1) {
            header("Location: admin_dashboard.php");
        } else {
            header("Location: index.php"); // Hoặc trang chủ của người dùng
        }
        exit(); // Luôn dùng exit sau header để dừng code

    } else {
        echo "<script>alert('Email hoặc mật khẩu không chính xác!');</script>";
    }
}
?>

<form method="POST">
    <h2>Đăng nhập Hệ thống</h2>
    <input type="email" name="email" placeholder="Email" required><br><br>
    <input type="password" name="password" placeholder="Mật khẩu" required><br><br>
    <button type="submit" name="login">Đăng nhập</button>
</form>