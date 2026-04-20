<?php
namespace App\Application;

use Core\Database;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class AuthService
{
    private const RESET_TOKEN_TTL_SECONDS = 3600;

    public function register(array $data)
    {
        $db = Database::getInstance();

        // 1. Kiểm tra Role 'customer'
        $roleStmt = $db->prepare('SELECT id FROM role WHERE name = ?');
        $roleStmt->execute(['customer']);
        $role = $roleStmt->fetch();
        if (!$role) {
            $db->exec("INSERT IGNORE INTO role (id, name, description) VALUES (1, 'system_admin', 'Administrator'), (2, 'manager', 'Manager'), (3, 'sales_staff', 'Sales'), (4, 'operations_staff', 'Operations'), (5, 'customer', 'Customer')");
            $roleId = 5;
        } else {
            $roleId = $role['id'];
        }

        // 2. Kiểm tra email trong bảng user
        $stmt = $db->prepare('SELECT id, status, verify_token, full_name FROM `user` WHERE email = ?');
        $stmt->execute([$data['email']]);
        $existingUser = $stmt->fetch();
        if ($existingUser) {
            if ($existingUser['status'] === 'inactive') {
                $verifyToken = $existingUser['verify_token'] ?: bin2hex(random_bytes(16));
                if (!$existingUser['verify_token']) {
                    $updateToken = $db->prepare('UPDATE `user` SET verify_token = ? WHERE id = ?');
                    $updateToken->execute([$verifyToken, $existingUser['id']]);
                }

                $verificationUrl = $this->buildVerificationUrl($verifyToken);
                try {
                    $this->sendVerificationEmail($data['email'], $data['name'] ?: $existingUser['full_name'] ?: $data['email'], $verifyToken);
                } catch (\Exception $e) {}

                return [
                    'id' => $existingUser['id'],
                    'name' => $data['name'] ?: $existingUser['full_name'],
                    'email' => $data['email'],
                    'roles' => ['customer'],
                    'verification_url' => $verificationUrl,
                    'email_sent' => true,
                    'resend_verification' => true,
                ];
            }
            throw new \Exception('Email already exists.');
        }

        $hash = password_hash($data['password'], PASSWORD_DEFAULT);
        $verifyToken = bin2hex(random_bytes(16));

        // 3. Chèn vào bảng user
        $stmt = $db->prepare('INSERT INTO `user` (full_name, email, password_hash, verify_token, status) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$data['name'], $data['email'], $hash, $verifyToken, 'inactive']);
        $userId = $db->lastInsertId();

        // 4. Gán vai trò mặc định (Customer) vào bảng trung gian user_roles
        $roleInsert = $db->prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
        $roleInsert->execute([$userId, $roleId]);

        $verificationUrl = $this->buildVerificationUrl($verifyToken);
        try {
            $this->sendVerificationEmail($data['email'], $data['name'] ?? $data['email'], $verifyToken);
        } catch (\Exception $e) {}

        return [
            'id' => $userId,
            'name' => $data['name'],
            'email' => $data['email'],
            'roles' => ['customer'],
            'verification_url' => $verificationUrl,
            'email_sent' => true,
        ];
    }

    public function login(array $credentials)
    {
        $db = Database::getInstance();
        
        // Truy vấn user
        $stmt = $db->prepare('SELECT * FROM `user` WHERE email = ?');
        $stmt->execute([$credentials['email']]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($credentials['password'], $user['password_hash'])) {
            throw new \Exception('Invalid credentials');
        }

        if ($user['status'] !== 'active') {
            throw new \Exception('Please verify your email or contact admin.');
        }

        // Lấy toàn bộ Role của User qua bảng trung gian
        $roleStmt = $db->prepare('SELECT r.name FROM role r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?');
        $roleStmt->execute([$user['id']]);
        $roles = $roleStmt->fetchAll(\PDO::FETCH_COLUMN);

        $tokenBody = $user['id'] . ':' . implode(',', $roles) . ':' . time();
        $token = base64_encode($tokenBody);

        return [
            'user' => [
                'id' => $user['id'],
                'name' => $user['full_name'],
                'email' => $user['email'],
                'roles' => $roles
            ],
            'token' => $token
        ];
    }

    public function logout(?string $token = null): bool
    {
        // Stateless token approach: logout is handled client-side by removing the token.
        return true;
    }

    public function verifyEmail(string $token): string
    {
        $db = Database::getInstance();
        $stmt = $db->prepare('SELECT id, email FROM `user` WHERE verify_token = ?');
        $stmt->execute([$token]);
        $user = $stmt->fetch();

        if (!$user) {
            throw new \Exception('Invalid or expired verification token.');
        }

        $update = $db->prepare("UPDATE `user` SET status = 'active', verify_token = NULL WHERE id = ?");
        $update->execute([$user['id']]);

        return $user['email'];
    }

    public function requestPasswordReset(string $email): array
    {
        $db = Database::getInstance();
        $normalizedEmail = strtolower(trim($email));

        $stmt = $db->prepare('SELECT id, full_name, email, status FROM `user` WHERE email = ? LIMIT 1');
        $stmt->execute([$normalizedEmail]);
        $user = $stmt->fetch();

        if (!$user) {
            return [
                'email_exists' => false,
                'email_sent' => false,
                'message' => 'Email is not registered. Please sign up.',
            ];
        }

        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);

        $upsert = $db->prepare(
            'INSERT INTO password_reset_tokens (email, token, created_at) VALUES (?, ?, NOW())
             ON DUPLICATE KEY UPDATE token = VALUES(token), created_at = VALUES(created_at)'
        );
        $upsert->execute([$normalizedEmail, $tokenHash]);

        $resetUrl = $this->buildResetPasswordUrl($normalizedEmail, $token);

        try {
            $this->sendResetPasswordEmail($normalizedEmail, $user['full_name'] ?: $normalizedEmail, $resetUrl);
            return [
                'email_exists' => true,
                'email_sent' => true,
                'message' => 'Email already exists. Password reset link has been sent.',
            ];
        } catch (\Exception $e) {
            return [
                'email_exists' => true,
                'email_sent' => false,
                'message' => 'Email already exists, but we could not send the reset link. Please try again later.',
                'reset_url' => $resetUrl,
                'email_error' => $e->getMessage(),
            ];
        }
    }

    public function resetPassword(array $data): void
    {
        $email = strtolower(trim($data['email'] ?? ''));
        $token = trim((string) ($data['token'] ?? ''));
        $password = (string) ($data['password'] ?? '');
        $passwordConfirmation = (string) ($data['password_confirmation'] ?? '');

        // Guard against token corruption from copied URLs (spaces/newlines/encoded chars).
        $normalizedToken = preg_replace('/\s+/', '', rawurldecode($token));

        if ($email === '' || $normalizedToken === '') {
            throw new \Exception('Invalid email or reset token.');
        }

        if (strlen($password) < 6) {
            throw new \Exception('New password must be at least 6 characters.');
        }

        if ($password !== $passwordConfirmation) {
            throw new \Exception('Password confirmation does not match.');
        }

        $db = Database::getInstance();
        $stmt = $db->prepare('SELECT email, token, created_at FROM password_reset_tokens WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $record = $stmt->fetch();

        if (!$record) {
            throw new \Exception('Invalid or expired password reset request.');
        }

        $createdAt = strtotime((string) $record['created_at']);
        if (!$createdAt || ($createdAt + self::RESET_TOKEN_TTL_SECONDS) < time()) {
            $this->deleteResetToken($email);
            throw new \Exception('Password reset link has expired. Please request a new one.');
        }

        $incomingHash = hash('sha256', $normalizedToken);
        $storedToken = (string) $record['token'];
        $isValidToken = hash_equals($storedToken, $incomingHash) || hash_equals($storedToken, $normalizedToken);

        if (!$isValidToken) {
            throw new \Exception('Invalid password reset token.');
        }

        $userStmt = $db->prepare('SELECT id FROM `user` WHERE email = ? LIMIT 1');
        $userStmt->execute([$email]);
        $user = $userStmt->fetch();

        if (!$user) {
            $this->deleteResetToken($email);
            throw new \Exception('Account does not exist.');
        }

        $newHash = password_hash($password, PASSWORD_DEFAULT);
        $update = $db->prepare('UPDATE `user` SET password_hash = ? WHERE id = ?');
        $update->execute([$newHash, $user['id']]);

        $this->deleteResetToken($email);
    }

    public function getUserIdFromToken(string $token): ?int
    {
        $decoded = base64_decode($token, true);
        if ($decoded === false) return null;
        $parts = explode(':', $decoded);
        return (count($parts) >= 1 && is_numeric($parts[0])) ? (int)$parts[0] : null;
    }

    public function getUserById(int $userId): ?array
    {
        $db = Database::getInstance();
        $stmt = $db->prepare('SELECT id, full_name, email, status FROM `user` WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) return null;

        $roleStmt = $db->prepare('SELECT r.name FROM role r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?');
        $roleStmt->execute([$userId]);
        $user['roles'] = $roleStmt->fetchAll(\PDO::FETCH_COLUMN);

        return $user;
    }

    private function sendVerificationEmail(string $email, string $name, string $token): void
    {
        $config = $this->loadEnvConfig();
        $mailHost = $config['MAIL_HOST'] ?? 'smtp.gmail.com';
        $mailPort = $config['MAIL_PORT'] ?? 587;
        $mailEncryption = $config['MAIL_ENCRYPTION'] ?? 'tls';
        $mailUsername = $config['MAIL_USERNAME'] ?? '';
        $mailPassword = $config['MAIL_PASSWORD'] ?? '';
        $mailFrom = $config['MAIL_FROM_ADDRESS'] ?? $mailUsername;
        $mailFromName = $config['MAIL_FROM_NAME'] ?? 'Eyewear System';
        $appUrl = rtrim($config['APP_URL'] ?? 'http://localhost:8000', '/');

        if (!$mailUsername || !$mailPassword) {
            throw new \Exception('SMTP email configuration is missing.');
        }

        if (!class_exists(PHPMailer::class)) {
            // Đảm bảo đường dẫn này đúng với project của bạn
            require_once dirname(__DIR__, 2) . '/PHPMailer/Exception.php';
            require_once dirname(__DIR__, 2) . '/PHPMailer/PHPMailer.php';
            require_once dirname(__DIR__, 2) . '/PHPMailer/SMTP.php';
        }

        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = $mailHost;
        $mail->SMTPAuth = true;
        $mail->Username = $mailUsername;
        $mail->Password = $mailPassword;
        $mail->SMTPSecure = $mailEncryption;
        $mail->Port = (int) $mailPort;
        $mail->CharSet = 'UTF-8';

        $mail->setFrom($mailFrom, $mailFromName);
        $mail->addAddress($email);
        $mail->isHTML(true);
        $mail->Subject = 'Xác thực tài khoản Eyewear';

        $verifyLink = $appUrl . '/api/auth/verify?token=' . urlencode($token);
        $mail->Body = "Chào {$name},<br><br>Vui lòng kích hoạt tài khoản tại đây:<br><br><a href=\"{$verifyLink}\">{$verifyLink}</a>";

        if (!$mail->send()) {
            throw new \Exception('Could not send verification email.');
        }
    }

    private function sendResetPasswordEmail(string $email, string $name, string $resetUrl): void
    {
        $config = $this->loadEnvConfig();
        $mailHost = $config['MAIL_HOST'] ?? 'smtp.gmail.com';
        $mailPort = $config['MAIL_PORT'] ?? 587;
        $mailEncryption = $config['MAIL_ENCRYPTION'] ?? 'tls';
        $mailUsername = $config['MAIL_USERNAME'] ?? '';
        $mailPassword = $config['MAIL_PASSWORD'] ?? '';
        $mailFrom = $config['MAIL_FROM_ADDRESS'] ?? $mailUsername;
        $mailFromName = $config['MAIL_FROM_NAME'] ?? 'Eyewear System';

        if (!$mailUsername || !$mailPassword) {
            throw new \Exception('SMTP email configuration is missing.');
        }

        if (!class_exists(PHPMailer::class)) {
            require_once dirname(__DIR__, 2) . '/PHPMailer/Exception.php';
            require_once dirname(__DIR__, 2) . '/PHPMailer/PHPMailer.php';
            require_once dirname(__DIR__, 2) . '/PHPMailer/SMTP.php';
        }

        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = $mailHost;
        $mail->SMTPAuth = true;
        $mail->Username = $mailUsername;
        $mail->Password = $mailPassword;
        $mail->SMTPSecure = $mailEncryption;
        $mail->Port = (int) $mailPort;
        $mail->CharSet = 'UTF-8';

        $mail->setFrom($mailFrom, $mailFromName);
        $mail->addAddress($email);
        $mail->isHTML(true);
        $mail->Subject = 'Dat lai mat khau Eyewear';
        $mail->Body = "Chao {$name},<br><br>Ban vua yeu cau dat lai mat khau.<br>Vui long nhan vao link duoi day (hieu luc 60 phut):<br><br><a href=\"{$resetUrl}\">{$resetUrl}</a>";

        if (!$mail->send()) {
            throw new \Exception('Could not send reset password email.');
        }
    }

    private function buildVerificationUrl(string $token): string
    {
        $config = $this->loadEnvConfig();
        $appUrl = rtrim($config['APP_URL'] ?? 'http://localhost:8000', '/');
        return $appUrl . '/api/auth/verify?token=' . urlencode($token);
    }

    private function buildResetPasswordUrl(string $email, string $token): string
    {
        $frontendUrl = $this->resolveFrontendBaseUrl();
        return $frontendUrl . '/pages/auth/reset-password.html?email=' . urlencode($email) . '&token=' . urlencode($token);
    }

    private function resolveFrontendBaseUrl(): string
    {
        $config = $this->loadEnvConfig();
        $frontendUrl = rtrim($config['FRONTEND_URL'] ?? 'http://127.0.0.1:5500/frontend', '/');
        $parsed = parse_url($frontendUrl);
        $path = $parsed['path'] ?? '';

        if ($path === '' || $path === '/') {
            return $frontendUrl . '/frontend';
        }

        if (!str_contains($path, '/frontend')) {
            return $frontendUrl . '/frontend';
        }

        return $frontendUrl;
    }

    private function deleteResetToken(string $email): void
    {
        $db = Database::getInstance();
        $delete = $db->prepare('DELETE FROM password_reset_tokens WHERE email = ?');
        $delete->execute([$email]);
    }

    private function parseEnvFile(string $path): array
    {
        $result = [];
        $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) return [];

        foreach ($lines as $line) {
            if (empty(trim($line)) || str_starts_with($line, '#')) continue;
            if (str_contains($line, '=')) {
                [$name, $value] = explode('=', $line, 2);
                $result[trim($name)] = trim($value, " \t\n\r\0\x0B\"'");
            }
        }
        return $result;
    }

    private function loadEnvConfig(): array
    {
        $envPath = dirname(__DIR__, 2) . '/.env';
        $envLocalPath = dirname(__DIR__, 2) . '/.env.local';
        $config = is_file($envPath) ? $this->parseEnvFile($envPath) : [];
        $localConfig = is_file($envLocalPath) ? $this->parseEnvFile($envLocalPath) : [];
        return array_merge($config, $localConfig);
    }
}