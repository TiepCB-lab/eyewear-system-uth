<?php
session_start();
include 'dp.php';

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

<h2>Đặt lại mật khẩu</h2>
<?php if ($message): ?>
    <p style="color: green;"><?php echo htmlspecialchars($message); ?></p>
    <p><a href="login.php">Đăng nhập lại</a></p>
<?php else: ?>
    <?php if ($error): ?>
        <p style="color: red;"><?php echo htmlspecialchars($error); ?></p>
    <?php endif; ?>

    <?php if ($email): ?>
        <form method="POST">
            <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">
            <label>Email: <strong><?php echo htmlspecialchars($email); ?></strong></label><br><br>
            <input type="password" name="password" placeholder="Mật khẩu mới" required><br><br>
            <input type="password" name="confirm_password" placeholder="Xác nhận mật khẩu mới" required><br><br>
            <button type="submit">Cập nhật mật khẩu</button>
        </form>
    <?php else: ?>
        <p>Không tìm thấy mã đặt lại hợp lệ.</p>
        <p><a href="forgot_password.php">Yêu cầu lại mã đặt mật khẩu</a></p>
    <?php endif; ?>
<?php endif; ?>
