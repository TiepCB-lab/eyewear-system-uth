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
        $this->validatePrescription($data);

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

    private function validatePrescription(array $data)
    {
        // Sph (Sphere) should be between -20.00 and +20.00
        $this->validateRange($data['sph_od'] ?? 0, -20.00, 20.00, "SPH OD");
        $this->validateRange($data['sph_os'] ?? 0, -20.00, 20.00, "SPH OS");

        // Cyl (Cylinder) should be between -10.00 and +10.00
        $this->validateRange($data['cyl_od'] ?? 0, -10.00, 10.00, "CYL OD");
        $this->validateRange($data['cyl_os'] ?? 0, -10.00, 10.00, "CYL OS");

        // Axis should be between 0 and 180
        if (isset($data['cyl_od']) && $data['cyl_od'] != 0) {
            $this->validateRange($data['axis_od'] ?? -1, 0, 180, "Axis OD");
        }
        if (isset($data['cyl_os']) && $data['cyl_os'] != 0) {
            $this->validateRange($data['axis_os'] ?? -1, 0, 180, "Axis OS");
        }

        // PD (Pupillary Distance) normally between 40 and 80
        if (isset($data['pd'])) {
            $this->validateRange($data['pd'], 40, 80, "PD");
        }
    }

    private function validateRange($value, $min, $max, $field)
    {
        if ($value < $min || $value > $max) {
            throw new Exception("Thông số $field ($value) không hợp lệ. Phải nằm trong khoảng $min đến $max.");
        }
    }
}
