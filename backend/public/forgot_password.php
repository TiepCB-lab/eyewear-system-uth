<?php
require_once __DIR__ . '/../dp.php';
require_once __DIR__ . '/../PHPMailer/Exception.php';
require_once __DIR__ . '/../PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../PHPMailer/SMTP.php';

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');

    if (!$email) {
        $error = 'Vui lòng nhập email.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Email không hợp lệ.';
    } else {
        $stmt = $conn->prepare('SELECT id, full_name FROM accounts WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            $error = 'Email này không tồn tại trong hệ thống.';
        } else {
            $conn->exec("CREATE TABLE IF NOT EXISTS password_reset_tokens (
                email VARCHAR(150) NOT NULL PRIMARY KEY,
                token VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            $token = bin2hex(random_bytes(16));
            $sql = 'INSERT INTO password_reset_tokens (email, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE token = VALUES(token), created_at = CURRENT_TIMESTAMP';
            $stmt = $conn->prepare($sql);
            $stmt->execute([$email, $token]);

            $resetLink = 'http://' . $_SERVER['HTTP_HOST'] . '/reset_password.php?token=' . urlencode($token);

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

<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quên mật khẩu</title>
    <style>
        body {
            margin: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #ffffff;
            color: #064e3b;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .page-wrapper {
            width: 100%;
            max-width: 480px;
            padding: 24px;
        }
        .auth-card {
            background: #ffffff;
            border: 1px solid #d1fae5;
            border-radius: 24px;
            box-shadow: 0 18px 40px rgba(15, 81, 46, 0.08);
            padding: 36px;
        }
        .auth-card h1 {
            margin-top: 0;
            margin-bottom: 20px;
            color: #0f766e;
            font-size: 2.2rem;
            letter-spacing: 0.02em;
        }
        .auth-card label {
            display: block;
            margin-bottom: 8px;
            font-weight: 700;
            color: #064e3b;
        }
        .auth-card input {
            width: 100%;
            padding: 14px 16px;
            margin-bottom: 18px;
            border: 1px solid #86efac;
            border-radius: 14px;
            background: #f5fffa;
            font-size: 1rem;
            color: #065f46;
        }
        .auth-card input:focus {
            outline: none;
            border-color: #10b981;
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.16);
        }
        .auth-card button {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 14px;
            background: #0f766e;
            color: #ffffff;
            font-size: 1.05rem;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .auth-card button:hover {
            transform: translateY(-1px);
            box-shadow: 0 14px 30px rgba(5, 150, 105, 0.28);
        }
        .auth-card .message {
            margin-bottom: 16px;
            padding: 12px 14px;
            border-radius: 12px;
        }
        .auth-card .message.success {
            background: #dcfce7;
            color: #166534;
        }
        .auth-card .message.error {
            background: #fee2e2;
            color: #991b1b;
        }
        .auth-card .back-link {
            margin-top: 18px;
            text-align: center;
        }
        .auth-card .back-link a {
            color: #047857;
            text-decoration: none;
            font-weight: 700;
        }
    </style>
</head>
<body>
    <div class="page-wrapper">
        <div class="auth-card">
            <h1>Quên mật khẩu</h1>
            <?php if ($message): ?>
                <p class="message success"><?php echo htmlspecialchars($message); ?></p>
            <?php endif; ?>
            <?php if ($error): ?>
                <p class="message error"><?php echo htmlspecialchars($error); ?></p>
            <?php endif; ?>
            <form method="post">
                <label>Email:</label>
                <input type="email" name="email" required>
                <button type="submit">Gửi yêu cầu</button>
            </form>
            <p class="back-link"><a href="http://127.0.0.1:5500/frontend/src/pages/auth/">Quay lại</a></p>
        </div>
    </div>
</body>
</html>
