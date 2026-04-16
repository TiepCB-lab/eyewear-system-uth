<?php

namespace App\Application;

use Core\Database;

class AdminService
{
    private const ALLOWED_STAFF_ROLES = ['system_admin', 'manager', 'sales_staff', 'operations_staff'];

    private function allowedRolesSql(): string
    {
        return "'" . implode("', '", self::ALLOWED_STAFF_ROLES) . "'";
    }

    public function getAllStaff(array $filters = []): array
    {
        $db = Database::getInstance();

        $sql = "SELECT u.id, u.full_name, u.email, u.phone, u.status, u.created_at, u.updated_at,
                       r.id AS role_id, r.name AS role_name, r.description AS role_description
                FROM `user` u
                LEFT JOIN role r ON r.id = u.role_id
                WHERE r.name IN (" . $this->allowedRolesSql() . ")";

        $params = [];

        if (!empty($filters['status'])) {
            $sql .= " AND u.status = ?";
            $params[] = $filters['status'];
        }

        if (!empty($filters['role'])) {
            $sql .= " AND r.name = ?";
            $params[] = $filters['role'];
        }

        $sql .= " ORDER BY u.created_at DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getStaffById(int $userId): ?array
    {
        $db = Database::getInstance();

        $stmt = $db->prepare(
            "SELECT u.id, u.full_name, u.email, u.phone, u.status, u.created_at, u.updated_at,
                    r.id AS role_id, r.name AS role_name, r.description AS role_description
             FROM `user` u
             LEFT JOIN role r ON r.id = u.role_id
             WHERE u.id = ? AND r.name IN (" . $this->allowedRolesSql() . ")"
        );
        $stmt->execute([$userId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    public function createStaff(array $data): array
    {
        $db = Database::getInstance();

        if (empty($data['full_name']) || empty($data['email']) || empty($data['password']) || empty($data['role_id'])) {
            throw new \Exception('Missing required fields: full_name, email, password, role_id');
        }

        $checkStmt = $db->prepare("SELECT id FROM `user` WHERE email = ?");
        $checkStmt->execute([$data['email']]);
        if ($checkStmt->fetch()) {
            throw new \Exception('Email already exists');
        }

        $roleStmt = $db->prepare("SELECT id, name FROM role WHERE id = ? AND name IN (" . $this->allowedRolesSql() . ")");
        $roleStmt->execute([$data['role_id']]);
        $role = $roleStmt->fetch();
        if (!$role) {
            throw new \Exception('Invalid role. Only system_admin, manager, sales_staff, and operations_staff roles are allowed.');
        }

        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
        $status = $data['status'] ?? 'active';
        $phone = $data['phone'] ?? null;

        $stmt = $db->prepare(
            "INSERT INTO `user` (role_id, full_name, email, password_hash, phone, status)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([$data['role_id'], $data['full_name'], $data['email'], $passwordHash, $phone, $status]);

        return $this->getStaffById((int) $db->lastInsertId());
    }

    public function updateStaffStatus(int $userId, string $status): array
    {
        $db = Database::getInstance();

        if (!in_array($status, ['active', 'inactive', 'blocked'], true)) {
            throw new \Exception('Invalid status. Must be: active, inactive, or blocked');
        }

        if (!$this->getStaffById($userId)) {
            throw new \Exception('Staff user not found');
        }

        $stmt = $db->prepare("UPDATE `user` SET status = ? WHERE id = ?");
        $stmt->execute([$status, $userId]);

        return $this->getStaffById($userId);
    }

    public function updateStaffRole(int $userId, int $roleId): array
    {
        $db = Database::getInstance();

        if (!$this->getStaffById($userId)) {
            throw new \Exception('Staff user not found');
        }

        $roleStmt = $db->prepare("SELECT id FROM role WHERE id = ? AND name IN (" . $this->allowedRolesSql() . ")");
        $roleStmt->execute([$roleId]);
        if (!$roleStmt->fetch()) {
            throw new \Exception('Invalid role. Only system_admin, manager, sales_staff, and operations_staff roles are allowed.');
        }

        $stmt = $db->prepare("UPDATE `user` SET role_id = ? WHERE id = ?");
        $stmt->execute([$roleId, $userId]);

        return $this->getStaffById($userId);
    }

    public function deleteStaff(int $userId): bool
    {
        $db = Database::getInstance();

        if (!$this->getStaffById($userId)) {
            throw new \Exception('Staff user not found');
        }

        $stmt = $db->prepare("UPDATE `user` SET status = 'inactive' WHERE id = ?");
        $stmt->execute([$userId]);

        return true;
    }

    public function getAllRoles(): array
    {
        $db = Database::getInstance();
        $stmt = $db->query("SELECT id, name, description FROM role ORDER BY name ASC");
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getRoleById(int $roleId): ?array
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT id, name, description FROM role WHERE id = ?");
        $stmt->execute([$roleId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    public function setSystemConfig(string $key, string $value): array
    {
        $db = Database::getInstance();

        if (trim($key) === '') {
            throw new \Exception('Configuration key cannot be empty');
        }

        $stmt = $db->prepare(
            "INSERT INTO system_config (config_key, config_value)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)"
        );
        $stmt->execute([$key, $value]);

        return ['key' => $key, 'value' => $value, 'stored' => true];
    }

    public function getSystemConfig(?string $key = null): array
    {
        $db = Database::getInstance();

        if ($key !== null && $key !== '') {
            $stmt = $db->prepare("SELECT config_value AS value FROM system_config WHERE config_key = ? LIMIT 1");
            $stmt->execute([$key]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);

            return $result ? ['key' => $key, 'value' => $result['value']] : ['key' => $key, 'value' => null];
        }

        $stmt = $db->query("SELECT config_key AS `key`, config_value AS value FROM system_config ORDER BY config_key ASC");
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function createVoucher(array $data): array
    {
        $db = Database::getInstance();

        $required = ['code', 'title', 'discount_type', 'discount_value', 'starts_at', 'ends_at'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \Exception("Missing required field: $field");
            }
        }

        if (!in_array($data['discount_type'], ['percentage', 'fixed'], true)) {
            throw new \Exception('Invalid discount_type. Must be: percentage or fixed');
        }

        $checkStmt = $db->prepare("SELECT id FROM promotion WHERE code = ?");
        $checkStmt->execute([$data['code']]);
        if ($checkStmt->fetch()) {
            throw new \Exception('Voucher code already exists');
        }

        $stmt = $db->prepare(
            "INSERT INTO promotion (code, title, discount_type, discount_value, starts_at, ends_at, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );

        $isActive = isset($data['is_active']) ? (int) (bool) $data['is_active'] : 1;
        $stmt->execute([
            $data['code'],
            $data['title'],
            $data['discount_type'],
            $data['discount_value'],
            $data['starts_at'],
            $data['ends_at'],
            $isActive,
        ]);

        return $this->getVoucherById((int) $db->lastInsertId());
    }

    public function getVoucherById(int $voucherId): ?array
    {
        $db = Database::getInstance();
        $stmt = $db->prepare(
            "SELECT id, code, title, discount_type, discount_value, starts_at, ends_at, is_active, created_at, updated_at
             FROM promotion WHERE id = ?"
        );
        $stmt->execute([$voucherId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    public function getAllVouchers(array $filters = []): array
    {
        $db = Database::getInstance();

        $sql = "SELECT id, code, title, discount_type, discount_value, starts_at, ends_at, is_active, created_at, updated_at
                FROM promotion
                WHERE 1 = 1";

        $params = [];

        if (isset($filters['is_active'])) {
            $sql .= " AND is_active = ?";
            $params[] = $filters['is_active'] ? 1 : 0;
        }

        if (!empty($filters['code'])) {
            $sql .= " AND code LIKE ?";
            $params[] = '%' . $filters['code'] . '%';
        }

        $sql .= " ORDER BY created_at DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function updateVoucher(int $voucherId, array $data): array
    {
        $db = Database::getInstance();

        if (!$this->getVoucherById($voucherId)) {
            throw new \Exception('Voucher not found');
        }

        $allowedFields = ['title', 'discount_type', 'discount_value', 'starts_at', 'ends_at', 'is_active'];
        $updates = [];
        $params = [];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updates[] = $field . ' = ?';
                $params[] = $data[$field];
            }
        }

        if (empty($updates)) {
            return $this->getVoucherById($voucherId);
        }

        $params[] = $voucherId;
        $sql = 'UPDATE promotion SET ' . implode(', ', $updates) . ' WHERE id = ?';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        return $this->getVoucherById($voucherId);
    }

    public function deactivateVoucher(int $voucherId): bool
    {
        $db = Database::getInstance();

        if (!$this->getVoucherById($voucherId)) {
            throw new \Exception('Voucher not found');
        }

        $stmt = $db->prepare("UPDATE promotion SET is_active = 0 WHERE id = ?");
        $stmt->execute([$voucherId]);

        return true;
    }
}