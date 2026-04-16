<?php
session_start();
include 'dp.php'; // File kết nối PDO của bạn

if (isset($_POST['login'])) {
    $email = $_POST['email'];
    $password = $_POST['password'];

    // 1. Sửa bảng 'accounts' thành 'user' cho đúng với database hiện tại
    $stmt = $conn->prepare("SELECT * FROM user WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // 2. Kiểm tra user có tồn tại và mật khẩu (password_hash)
    if ($user && password_verify($password, $user['password_hash'])) {
        
        // 3. Kiểm tra trạng thái xác thực (status trong bảng của bạn)
        // Nếu status = 0 là chưa xác thực, status = 1 là đã xong
        if ($user['status'] == 0) {
            die("<script>alert('Tài khoản này chưa được xác thực email. Vui lòng kiểm tra hộp thư!'); window.location='login.php';</script>");
        }

        // 4. Lưu thông tin vào Session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['full_name'] = $user['full_name'];
        $_SESSION['role_id'] = $user['role_id'];

        // 5. Phân quyền hướng trang (1 là Admin, 2 là User)
        if ($user['role_id'] == 1) {
            header("Location: admin_dashboard.php");
        } else {
            header("Location: index.php");
        }
        exit(); 

    } else {
        echo "<script>alert('Email hoặc mật khẩu không chính xác!');</script>";
    }
}
?>

<form method="POST" style="margin-top: 20px;">
    <h2>Đăng nhập Hệ thống</h2>
    <input type="email" name="email" placeholder="Email" required><br><br>
    <input type="password" name="password" placeholder="Mật khẩu" required><br><br>
    <button type="submit" name="login">Đăng nhập</button>
</form>
<p><a href="forgot_password.php">Quên mật khẩu?</a></p>