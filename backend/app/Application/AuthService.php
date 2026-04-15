<?php
namespace App\Application;

use Core\Database;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class AuthService
{
    public function register(array $data)
    {
        // Lấy kết nối PDO thực tế từ Database Instance
        $db = Database::getInstance();

        // 1. Kiểm tra Role 'customer'
        $roleStmt = $db->prepare('SELECT id FROM role WHERE name = ?');
        $roleStmt->execute(['customer']);
        $role = $roleStmt->fetch();
        if (!$role) {
            $db->exec("INSERT IGNORE INTO role (id, name, description) VALUES (1, 'admin', 'Administrator'), (2, 'staff', 'Staff Member'), (3, 'customer', 'Customer')");
            $roleId = 3;
        } else {
            $roleId = $role['id'];
        }

        // 2. Kiểm tra email trong bảng accounts
        $stmt = $db->prepare('SELECT id FROM accounts WHERE email = ?');
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            throw new \Exception('Email already exists');
        }

        $hash = password_hash($data['password'], PASSWORD_DEFAULT);
        $verifyToken = bin2hex(random_bytes(16));

        // 3. Chèn dữ liệu (Khớp hoàn toàn với các cột: full_name, email, password_hash, role_id, status, verify_token)
        $stmt = $db->prepare('INSERT INTO accounts (role_id, full_name, email, password_hash, verify_token, status) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$roleId, $data['name'], $data['email'], $hash, $verifyToken, 0]);
        $userId = $db->lastInsertId();

        $verificationUrl = $this->buildVerificationUrl($verifyToken);
        $emailError = null;

        try {
            $this->sendVerificationEmail($data['email'], $data['name'] ?? $data['email'], $verifyToken);
        } catch (\Exception $e) {
            $emailError = $e->getMessage();
        }

        $result = [
            'id' => $userId,
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => 'customer',
            'verification_url' => $verificationUrl,
            'email_sent' => $emailError === null,
        ];

        if ($emailError !== null) {
            $result['email_error'] = $emailError;
        }

        return $result;
    }

    public function login(array $credentials)
    {
        $db = Database::getInstance();
        
        $stmt = $db->prepare('SELECT u.*, r.name as role_name FROM accounts u JOIN role r ON u.role_id = r.id WHERE u.email = ?');
        $stmt->execute([$credentials['email']]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($credentials['password'], $user['password_hash'])) {
            throw new \Exception('Invalid credentials');
        }

        if ((int) $user['status'] !== 1) {
            throw new \Exception('Please verify your email before logging in.');
        }

        $tokenBody = $user['id'] . ':' . $user['role_name'] . ':' . time();
        $token = base64_encode($tokenBody);

        return [
            'user' => [
                'id' => $user['id'],
                'name' => $user['full_name'],
                'email' => $user['email'],
                'role' => $user['role_name']
            ],
            'token' => $token
        ];
    }

    public function verifyEmail(string $token): string
    {
        $db = Database::getInstance();
        
        $stmt = $db->prepare('SELECT id, email FROM accounts WHERE verify_token = ?');
        $stmt->execute([$token]);
        $user = $stmt->fetch();

        if (!$user) {
            throw new \Exception('Invalid or expired verification token.');
        }

        $update = $db->prepare("UPDATE accounts SET status = 1, verify_token = NULL WHERE id = ?");
        $update->execute([$user['id']]);

        return $user['email'];
    }

    public function getUserIdFromToken(string $token): ?int
    {
        $decoded = base64_decode($token, true);
        if ($decoded === false) {
            return null;
        }

        $parts = explode(':', $decoded);
        if (count($parts) < 1 || !is_numeric($parts[0])) {
            return null;
        }

        return (int)$parts[0];
    }

    public function getUserById(int $userId): ?array
    {
        $db = Database::getInstance();
        $stmt = $db->prepare('SELECT u.id, u.full_name, u.email, r.name as role_name FROM accounts u JOIN role r ON u.role_id = r.id WHERE u.id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        return $user ?: null;
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

    private function buildVerificationUrl(string $token): string
    {
        $config = $this->loadEnvConfig();
        $appUrl = rtrim($config['APP_URL'] ?? 'http://localhost:8000', '/');
        return $appUrl . '/api/auth/verify?token=' . urlencode($token);
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