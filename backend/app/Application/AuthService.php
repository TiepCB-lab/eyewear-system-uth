<?php
namespace App\Application;

use Core\Database;

class AuthService
{
    public function register(array $data)
    {
        $db = Database::getInstance();

        // Ensure roles exist
        $roleStmt = $db->prepare('SELECT id FROM role WHERE name = ?');
        $roleStmt->execute(['customer']);
        $role = $roleStmt->fetch();
        if (!$role) {
            $db->exec("INSERT IGNORE INTO role (id, name, description) VALUES (1, 'admin', 'Administrator'), (2, 'staff', 'Staff Member'), (3, 'customer', 'Customer')");
            $roleId = 3;
        } else {
            $roleId = $role['id'];
        }

        $stmt = $db->prepare('SELECT id FROM user WHERE email = ?');
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            throw new \Exception('Email already exists');
        }

        $hash = password_hash($data['password'], PASSWORD_DEFAULT);

        $stmt = $db->prepare('INSERT INTO `user` (role_id, full_name, email, password_hash) VALUES (?, ?, ?, ?)');
        $stmt->execute([$roleId, $data['name'], $data['email'], $hash]);
        $userId = $db->lastInsertId();

        return [
            'id' => $userId,
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => 'customer'
        ];
    }

    public function login(array $credentials)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare('SELECT u.*, r.name as role_name FROM `user` u JOIN role r ON u.role_id = r.id WHERE u.email = ?');
        $stmt->execute([$credentials['email']]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($credentials['password'], $user['password_hash'])) {
            throw new \Exception('Invalid credentials');
        }

        // Generate simple mock token: base64(userId:roleName:timestamp)
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
}