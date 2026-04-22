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
        $check = $conn->prepare("SELECT id FROM `user` WHERE email = ?");
        $check->execute([$email]);
        if ($check->fetch()) {
            echo "Email này đã được sử dụng. Vui lòng dùng email khác.";
            exit;
        }

        $roleStmt = $conn->prepare("SELECT id FROM role WHERE name = ?");
        $roleStmt->execute(['customer']);
        $role = $roleStmt->fetch();
        if ($role) {
            $roleId = (int) $role['id'];
        } else {
            $insertRole = $conn->prepare("INSERT INTO role (name, description) VALUES (?, ?)");
            $insertRole->execute(['customer', 'Customer']);
            $roleId = (int) $conn->lastInsertId();
        }

        $pass_hash = password_hash($password, PASSWORD_DEFAULT);
        $token = bin2hex(random_bytes(16));
        $full_name = explode('@', $email)[0];

        $sql = "INSERT INTO `user` (full_name, email, password_hash, verify_token, status, role_id) VALUES (?, ?, ?, ?, 'active', ?)";
        $stmt = $conn->prepare($sql);

        if (!$stmt->execute([$full_name, $email, $pass_hash, $token, $roleId])) {
            echo "Đăng ký thất bại. Vui lòng thử lại.";
            exit;
        }

        $verifyLink = 'http://localhost:5500/pages/auth/?token=' . urlencode($token);

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
                $mail->Subject = '[EVLS] Xác thực tài khoản của bạn';
                $mail->Body = "
                <div style='font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #1f2937; background: #f7faf9; padding: 24px;'>
                    <div style='max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e4ede9; border-radius: 18px; overflow: hidden;'>
                        <div style='background: linear-gradient(135deg, #0f8b7c, #0b6f63); color: #fff; padding: 22px 28px;'>
                            <h2 style='margin: 0; font-size: 22px;'>[EVLS] Xác thực tài khoản của bạn</h2>
                        </div>
                        <div style='padding: 28px; font-size: 15px;'>
                            <p style='margin: 0 0 14px 0;'>Chào $full_name,</p>
                            <p style='margin: 0 0 14px 0;'>Cảm ơn bạn đã tin tưởng và lựa chọn đồng hành cùng EVLS.</p>
                            <p style='margin: 0 0 18px 0;'>Để hoàn tất việc đăng ký và bắt đầu trải nghiệm mua sắm, bạn vui lòng nhấn vào nút xác nhận bên dưới:</p>
                            <p style='text-align: center; margin: 28px 0;'>
                                <a href='$verifyLink' style='display: inline-block; background: #0f8b7c; color: #fff; text-decoration: none; font-weight: 700; padding: 14px 24px; border-radius: 999px;'>Xác nhận Email của tôi</a>
                            </p>
                            <p style='margin: 0 0 14px 0;'>Việc xác thực này giúp bảo mật tài khoản của bạn và đảm bảo bạn không bỏ lỡ bất kỳ ưu đãi đặc quyền nào từ EVLS.</p>
                            <p style='margin: 24px 0 0 0; font-size: 13px; color: #6b7280;'>Nếu nút không hoạt động, bạn có thể mở liên kết sau:<br><a href='$verifyLink' style='color: #0f8b7c; word-break: break-all;'>$verifyLink</a></p>
                        </div>
                    </div>
                </div>";

        $mail->send();
        echo "Đăng ký thành công! Hãy kiểm tra hộp thư của bạn để kích hoạt tài khoản.";
    } catch (PDOException $e) {
        echo "Lỗi Database: " . $e->getMessage();
    } catch (Exception $e) {
        if (isset($conn) && isset($email)) {
            $delete = $conn->prepare("DELETE FROM `user` WHERE email = ?");
            $delete->execute([$email]);
        }
        echo "Lỗi khi gửi mail: " . $e->getMessage();
    }
}
?>