<?php

namespace App\Application;

use Core\Database;
use PDO;
use Exception;

class PrescriptionService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function savePrescription(int $userId, array $data)
    {
        $stmt = $this->db->prepare("
            INSERT INTO prescription (
                user_id, sph_od, sph_os, cyl_od, cyl_os, axis_od, axis_os, pd, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $data['sph_od'] ?? null,
            $data['sph_os'] ?? null,
            $data['cyl_od'] ?? null,
            $data['cyl_os'] ?? null,
            $data['axis_od'] ?? null,
            $data['axis_os'] ?? null,
            $data['pd'] ?? null,
            $data['notes'] ?? null
        ]);

        return $this->db->lastInsertId();
    }

    public function getUserPrescriptions(int $userId)
    {
        $stmt = $this->db->prepare("SELECT * FROM prescription WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }
}
