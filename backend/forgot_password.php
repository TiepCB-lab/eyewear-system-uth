<?php
session_start();
include 'dp.php';

require 'PHPMailer/Exception.php';
require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');

    if (!$email) {
        $error = 'Vui lòng nhập email.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Email không hợp lệ.';
    } else {
        $check = $conn->prepare('SELECT id, full_name FROM accounts WHERE email = ?');
        $check->execute([$email]);
        $user = $check->fetch();

        if (!$user) {
            $error = 'Email này không tồn tại trong hệ thống.';
        } else {
            $token = bin2hex(random_bytes(16));
            $conn->exec("CREATE TABLE IF NOT EXISTS password_reset_tokens (
                email VARCHAR(150) NOT NULL PRIMARY KEY,
                token VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            $sql = 'INSERT INTO password_reset_tokens (email, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE token = VALUES(token), created_at = CURRENT_TIMESTAMP';
            $stmt = $conn->prepare($sql);
            $stmt->execute([$email, $token]);

            $resetLink = sprintf('http://%s%s/reset_password.php?token=%s', $_SERVER['HTTP_HOST'], dirname($_SERVER['PHP_SELF']), urlencode($token));

            try {
                $mail = new PHPMailer\PHPMailer\PHPMailer(true);
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
                $mail->Subject = 'Yêu cầu đặt lại mật khẩu';
                $mail->Body = "Chào {$user['full_name']},<br><br>Vui lòng nhấp vào đường dẫn sau để tạo mật khẩu mới:<br><br><a href=\"{$resetLink}\">{$resetLink}</a><br><br>Đường dẫn có hiệu lực trong 60 phút.";

                $mail->send();
                $message = 'Nếu email tồn tại trong hệ thống, một đường dẫn đặt lại mật khẩu đã được gửi.';
            } catch (Exception $e) {
                $error = 'Không thể gửi email. Vui lòng thử lại sau.';
            }
        }
    }
}
?>

<h2>Quên mật khẩu</h2>
<?php if ($message): ?>
    <p style="color: green;"><?php echo htmlspecialchars($message); ?></p>
<?php endif; ?>
<?php if ($error): ?>
    <p style="color: red;"><?php echo htmlspecialchars($error); ?></p>
<?php endif; ?>
<form method="POST">
    <input type="email" name="email" placeholder="Email" required><br><br>
    <button type="submit">Gửi yêu cầu</button>
</form>
<p><a href="login.php">Quay lại đăng nhập</a></p>
