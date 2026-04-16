<?php
require_once __DIR__ . '/../dp.php';

$error = '';
$message = '';
$token = $_GET['token'] ?? '';
$email = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['token'] ?? '';
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm_password'] ?? '';

    if (!$token) {
        $error = 'Thiếu mã đặt lại mật khẩu.';
    } elseif (!$password || !$confirm) {
        $error = 'Vui lòng nhập mật khẩu mới và xác nhận lại.';
    } elseif ($password !== $confirm) {
        $error = 'Mật khẩu và xác nhận mật khẩu không khớp.';
    } elseif (strlen($password) < 6) {
        $error = 'Mật khẩu phải có ít nhất 6 ký tự.';
    } else {
        $stmt = $conn->prepare('SELECT email, created_at FROM password_reset_tokens WHERE token = ?');
        $stmt->execute([$token]);
        $row = $stmt->fetch();

        if (!$row) {
            $error = 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.';
        } else {
            $createdAt = new DateTime($row['created_at']);
            $expiry = (new DateTime())->sub(new DateInterval('PT60M'));
            if ($createdAt < $expiry) {
                $error = 'Mã đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.';
            } else {
                $passHash = password_hash($password, PASSWORD_DEFAULT);
                $update = $conn->prepare('UPDATE accounts SET password_hash = ? WHERE email = ?');
                $update->execute([$passHash, $row['email']]);

                $delete = $conn->prepare('DELETE FROM password_reset_tokens WHERE token = ?');
                $delete->execute([$token]);

                $message = 'Mật khẩu đã được cập nhật thành công. Bạn có thể đăng nhập bằng mật khẩu mới.';
            }
        }
    }
} elseif ($token) {
    $stmt = $conn->prepare('SELECT email FROM password_reset_tokens WHERE token = ?');
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    if ($row) {
        $email = $row['email'];
    } else {
        $error = 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.';
    }
}
?>

<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đặt lại mật khẩu</title>
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
            max-width: 520px;
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
            margin-bottom: 22px;
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
        .auth-card .email-display {
            margin-bottom: 18px;
            font-weight: 700;
            color: #065f46;
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
            margin-bottom: 18px;
            padding: 14px 16px;
            border-radius: 14px;
            font-weight: 600;
        }
        .auth-card .message.success {
            background: #d1fae5;
            color: #115e59;
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
            <h1>Đặt lại mật khẩu</h1>
            <?php if ($message): ?>
                <p class="message success"><?php echo htmlspecialchars($message); ?></p>
                <p class="back-link"><a href="http://127.0.0.1:5500/frontend/src/pages/auth/">Đăng nhập</a></p>
                <script>
                  setTimeout(() => {
                    window.location.href = 'http://127.0.0.1:5500/frontend/src/pages/auth/';
                  }, 4000);
                </script>
            <?php else: ?>
                <?php if ($error): ?>
                    <p class="message error"><?php echo htmlspecialchars($error); ?></p>
                <?php endif; ?>

                <?php if ($email): ?>
                    <form method="post">
                        <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">
                        <label>Email:</label>
                        <p class="email-display"><?php echo htmlspecialchars($email); ?></p>
                        <label>Mật khẩu mới:</label>
                        <input type="password" name="password" required>
                        <label>Xác nhận mật khẩu:</label>
                        <input type="password" name="confirm_password" required>
                        <button type="submit">Cập nhật mật khẩu</button>
                    </form>
                <?php else: ?>
                    <p>Không tìm thấy mã đặt lại hợp lệ.</p>
                    <p class="back-link"><a href="http://127.0.0.1:8000/forgot_password.php">Yêu cầu lại mã đặt mật khẩu</a></p>
                <?php endif; ?>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
