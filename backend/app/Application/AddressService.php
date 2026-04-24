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
        $stmt = $this->db->prepare("SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function addAddress(int $userId, array $data) {
        // Validate
        if (empty($data['address']) || empty($data['phone'])) {
            throw new Exception("Address and phone are required.");
        }

        // Check if first address
        $count = $this->db->prepare("SELECT COUNT(*) FROM user_addresses WHERE user_id = ?");
        $count->execute([$userId]);
        $isFirst = (int)$count->fetchColumn() === 0;

        $isDefault = ($isFirst || ($data['is_default'] ?? false)) ? 1 : 0;

        if ($isDefault) {
            $this->db->prepare("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?")->execute([$userId]);
        }

        $stmt = $this->db->prepare("
            INSERT INTO user_addresses (user_id, label, address, phone, is_default)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $userId,
            $data['label'] ?? 'Home',
            $data['address'],
            $data['phone'],
            $isDefault
        ]);

        return $this->db->lastInsertId();
    }

    public function updateAddress(int $userId, int $addressId, array $data) {
        $stmt = $this->db->prepare("SELECT user_id FROM user_addresses WHERE id = ?");
        $stmt->execute([$addressId]);
        $addr = $stmt->fetch();
        if (!$addr || $addr['user_id'] != $userId) {
            throw new Exception("Address not found.");
        }

        if (isset($data['is_default']) && $data['is_default']) {
            $this->db->prepare("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?")->execute([$userId]);
        }

        $fields = [];
        $params = [];
        if (isset($data['label'])) { $fields[] = "label = ?"; $params[] = $data['label']; }
        if (isset($data['address'])) { $fields[] = "address = ?"; $params[] = $data['address']; }
        if (isset($data['phone'])) { $fields[] = "phone = ?"; $params[] = $data['phone']; }
        if (isset($data['is_default'])) { $fields[] = "is_default = ?"; $params[] = $data['is_default'] ? 1 : 0; }

        if (empty($fields)) return true;

        $params[] = $addressId;
        $sql = "UPDATE user_addresses SET " . implode(", ", $fields) . " WHERE id = ?";
        return $this->db->prepare($sql)->execute($params);
    }

    public function deleteAddress(int $userId, int $addressId) {
        $stmt = $this->db->prepare("DELETE FROM user_addresses WHERE id = ? AND user_id = ?");
        return $stmt->execute([$addressId, $userId]);
    }
}
