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
        $stmt = $this->db->prepare("SELECT id, user_id, phone, address, updated_at FROM profiles WHERE user_id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $profile = $stmt->fetch();

        if (!$profile || empty($profile['address'])) {
            return [];
        }

        return [[
            'id' => $profile['id'],
            'user_id' => $profile['user_id'],
            'label' => 'Home',
            'address' => $profile['address'],
            'phone' => $profile['phone'] ?? '',
            'is_default' => 1,
            'created_at' => $profile['updated_at'] ?? null,
            'updated_at' => $profile['updated_at'] ?? null,
        ]];
    }

    public function addAddress(int $userId, array $data) {
        // Validate
        if (empty($data['address']) || empty($data['phone'])) {
            throw new Exception("Address and phone are required.");
        }

        $stmt = $this->db->prepare("SELECT id FROM profiles WHERE user_id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $profileId = $stmt->fetchColumn();

        if ($profileId) {
            $update = $this->db->prepare("UPDATE profiles SET address = ?, phone = ? WHERE user_id = ?");
            $update->execute([$data['address'], $data['phone'], $userId]);
            return (int) $profileId;
        }

        $create = $this->db->prepare("INSERT INTO profiles (user_id, phone, address) VALUES (?, ?, ?)");
        $create->execute([$userId, $data['phone'], $data['address']]);

        return (int) $this->db->lastInsertId();
    }

    public function updateAddress(int $userId, int $addressId, array $data) {
        $stmt = $this->db->prepare("SELECT id, user_id FROM profiles WHERE id = ? AND user_id = ? LIMIT 1");
        $stmt->execute([$addressId, $userId]);
        $addr = $stmt->fetch();
        if (!$addr) {
            throw new Exception("Address not found.");
        }

        $fields = [];
        $params = [];

        if (isset($data['address'])) {
            $fields[] = "address = ?";
            $params[] = $data['address'];
        }

        if (isset($data['phone'])) {
            $fields[] = "phone = ?";
            $params[] = $data['phone'];
        }

        if (empty($fields)) {
            return true;
        }

        $params[] = $userId;
        $sql = "UPDATE profiles SET " . implode(", ", $fields) . " WHERE user_id = ?";
        return $this->db->prepare($sql)->execute($params);
    }

    public function deleteAddress(int $userId, int $addressId) {
        $stmt = $this->db->prepare("UPDATE profiles SET address = NULL WHERE id = ? AND user_id = ?");
        return $stmt->execute([$addressId, $userId]);
    }
}
