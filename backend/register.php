<?php
// 1. Cấu hình Headers để tránh lỗi CORS khi gọi từ Live Server hoặc frontend khác
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
header("Content-Type: text/plain; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/Exception.php';
require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';
include 'dp.php'; // File kết nối Database của bạn

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (!$email || !$password) {
        echo "Vui lòng nhập đầy đủ email và mật khẩu!";
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "Email không hợp lệ.";
        exit;
    }

    if (strlen($password) < 6) {
        echo "Mật khẩu phải có ít nhất 6 ký tự.";
        exit;
    }

    try {
        $check = $conn->prepare("SELECT id FROM user WHERE email = ?");
        $check->execute([$email]);
        if ($check->fetch()) {
            echo "Email này đã được sử dụng. Vui lòng dùng email khác.";
            exit;
        }

        $pass_hash = password_hash($password, PASSWORD_DEFAULT);
        $token = bin2hex(random_bytes(16));
        $full_name = explode('@', $email)[0];

        $sql = "INSERT INTO user (full_name, email, password_hash, verify_token, status, role_id) VALUES (?, ?, ?, ?, 0, 2)";
        $stmt = $conn->prepare($sql);

        if (!$stmt->execute([$full_name, $email, $pass_hash, $token])) {
            echo "Đăng ký thất bại. Vui lòng thử lại.";
            exit;
        }

        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $path = rtrim(dirname($_SERVER['PHP_SELF']), '/\\');
        $verifyLink = "$protocol://$host$path/verify.php?token=$token";

        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'nhuy1532005@gmail.com';
        $mail->Password = 'wgsosxcfmrmmtvid';
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;
        $mail->CharSet = 'UTF-8';

        $mail->setFrom('nhuy1532005@gmail.com', 'Eyewear System');
        $mail->addAddress($email);
        $mail->isHTML(true);
        $mail->Subject = 'Xác thực tài khoản Eyewear';
        $mail->Body = "Chào $full_name,<br><br>Vui lòng bấm vào link bên dưới để kích hoạt tài khoản của bạn:<br><br><a href='$verifyLink'>$verifyLink</a><br><br>Xin cảm ơn!";

        $mail->send();
        echo "Đăng ký thành công! Hãy kiểm tra hộp thư của bạn để kích hoạt tài khoản.";
    } catch (PDOException $e) {
        echo "Lỗi Database: " . $e->getMessage();
    } catch (Exception $e) {
        if (isset($conn) && isset($email)) {
            $delete = $conn->prepare("DELETE FROM accounts WHERE email = ?");
            $delete->execute([$email]);
        }
        echo "Lỗi khi gửi mail: " . $e->getMessage();
    }
}
?>