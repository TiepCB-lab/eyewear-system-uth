<?php
// PHẢI Ở TRÊN CÙNG: Cho phép Frontend từ cổng 5500 truy cập
header("Access-Control-Allow-Origin: http://localhost:5500");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Xử lý yêu cầu Preflight (trình duyệt gửi lệnh hỏi trước khi gửi dữ liệu thật)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/Exception.php';
require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';
include 'dp.php'; // Đảm bảo file này đúng tên và kết nối được Database

// Nhận dữ liệu JSON từ JavaScript
$input = file_get_contents("php://input");
$data = json_decode($input, true);

$email = $data['email'] ?? null;
$password = $data['password'] ?? null;
$name = $data['name'] ?? null;

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Vui lòng nhập đầy đủ thông tin!"]);
    exit;
}

try {
    // Kiểm tra email đã tồn tại chưa
    $check = $conn->prepare("SELECT id FROM accounts WHERE email = ?");
    $check->execute([$email]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "Email này đã được sử dụng!"]);
        exit;
    }

    $pass_hash = password_hash($password, PASSWORD_DEFAULT);
    $token = bin2hex(random_bytes(16));
    $full_name = $name ? $name : explode('@', $email)[0];

    // Lưu vào Database với is_verified = 0
    $sql = "INSERT INTO accounts (full_name, email, password_hash, verify_token, is_verified) VALUES (?, ?, ?, ?, 0)";
    $stmt = $conn->prepare($sql);
    
    if ($stmt->execute([$full_name, $email, $pass_hash, $token])) {
        // Gửi Mail
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
        $mail->Subject = 'Xac thuc tai khoan';
        
        $verifyLink = "http://localhost:5500/pages/auth/?token=" . urlencode($token);

        $mail->Body = "Chào $full_name, <br>Bấm vào link để kích hoạt: <a href='$verifyLink'>KÍCH HOẠT</a>";
        
        $mail->send();
        
        http_response_code(201);
        echo json_encode(["status" => "success", "message" => "Đăng ký thành công! Hãy kiểm tra Email."]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Lỗi: " . $e->getMessage()]);
}
?>