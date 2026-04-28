<?php
namespace App\Application;

use Core\Database;
use PDO;
use Exception;

class AddressService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function getAddresses(int $userId) {
        $stmt = $this->db->prepare("SELECT id, user_id, label, phone, address, is_default, created_at, updated_at FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function addAddress(int $userId, array $data) {
        // Validate
        if (empty($data['address']) || empty($data['phone'])) {
            throw new Exception("Address and phone are required.");
        }

        $label = $data['label'] ?? 'Home';
        $isDefault = (isset($data['is_default']) && (int)$data['is_default'] === 1) ? 1 : 0;

        // Check if this is the first address for the user
        $checkStmt = $this->db->prepare("SELECT COUNT(*) FROM user_addresses WHERE user_id = ?");
        $checkStmt->execute([$userId]);
        $count = (int)$checkStmt->fetchColumn();

        if ($count === 0) {
            $isDefault = 1;
        } elseif ($isDefault === 1) {
            // If setting a new default, unset others
            $this->db->prepare("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?")->execute([$userId]);
        }

        $create = $this->db->prepare("INSERT INTO user_addresses (user_id, label, phone, address, is_default) VALUES (?, ?, ?, ?, ?)");
        $create->execute([$userId, $label, $data['phone'], $data['address'], $isDefault]);

        return (int) $this->db->lastInsertId();
    }

    public function updateAddress(int $userId, int $addressId, array $data) {
        $stmt = $this->db->prepare("SELECT id FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1");
        $stmt->execute([$addressId, $userId]);
        if (!$stmt->fetch()) {
            throw new Exception("Address not found.");
        }

        $fields = [];
        $params = [];

        if (isset($data['label'])) {
            $fields[] = "label = ?";
            $params[] = $data['label'];
        }
        if (isset($data['address'])) {
            $fields[] = "address = ?";
            $params[] = $data['address'];
        }
        if (isset($data['phone'])) {
            $fields[] = "phone = ?";
            $params[] = $data['phone'];
        }
        if (isset($data['is_default'])) {
            $isDefault = (int)$data['is_default'];
            if ($isDefault === 1) {
                $this->db->prepare("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?")->execute([$userId]);
            }
            $fields[] = "is_default = ?";
            $params[] = $isDefault;
        }

        if (empty($fields)) {
            return true;
        }

        $params[] = $addressId;
        $params[] = $userId;
        $sql = "UPDATE user_addresses SET " . implode(", ", $fields) . " WHERE id = ? AND user_id = ?";
        return $this->db->prepare($sql)->execute($params);
    }

    public function deleteAddress(int $userId, int $addressId) {
        $stmt = $this->db->prepare("DELETE FROM user_addresses WHERE id = ? AND user_id = ?");
        return $stmt->execute([$addressId, $userId]);
    }
}
