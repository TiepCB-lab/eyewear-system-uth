<?php

namespace App\Application;

use App\Models\Profile;
use App\Models\User;
use Core\Database;

class ProfileService
{
    /**
     * Lấy profile của user
     */
    public function getProfile(int $userId)
    {
        $db = Database::getInstance();

        $userStmt = $db->prepare('SELECT id, full_name, email, status FROM `user` WHERE id = ? LIMIT 1');
        $userStmt->execute([$userId]);
        $user = $userStmt->fetch(\PDO::FETCH_ASSOC);

        if (!$user) {
            return null;
        }

        $profile = Profile::firstWhere('user_id', $userId);
        $profileData = $profile ? $profile->toArray() : ['user_id' => $userId, 'phone' => null, 'address' => null, 'avatar' => null, 'birthdate' => null];

        $ordersStmt = $db->prepare(
            'SELECT o.id, o.order_number, o.status, o.total_amount, o.placed_at, o.production_step,
                    COALESCE(p.status, o.status) AS payment_status
             FROM `order` o
             LEFT JOIN payment p ON p.order_id = o.id
             WHERE o.user_id = ?
             ORDER BY o.placed_at DESC
             LIMIT 5'
        );
        $ordersStmt->execute([$userId]);
        $recentOrders = $ordersStmt->fetchAll(\PDO::FETCH_ASSOC);

        return array_merge($profileData, [
            'user' => $user,
            'recent_orders' => $recentOrders,
            'billing_address' => $profileData['address'] ?? null,
        ]);
    }

    /**
     * Cập nhật thông tin profile
     */
    public function updateProfile(int $userId, array $data)
    {
        $profile = Profile::firstWhere('user_id', $userId);

        if (!$profile) {
            $profile = Profile::create([
                'user_id' => $userId,
                'phone' => $data['phone'] ?? null,
                'address' => $data['address'] ?? null,
                'birthdate' => $data['birthdate'] ?? null,
            ]);
            return $profile->toArray();
        }

        $updateData = [];
        if (isset($data['phone'])) $updateData['phone'] = $data['phone'];
        if (isset($data['address'])) $updateData['address'] = $data['address'];
        if (isset($data['birthdate'])) $updateData['birthdate'] = $data['birthdate'];

        if (!empty($updateData)) {
            $profile->update($updateData);
        }

        return $profile->toArray();
    }

    /**
     * Upload avatar
     */
    public function uploadAvatar(int $userId, string $filePath)
    {
        $profile = Profile::firstWhere('user_id', $userId);

        if (!$profile) {
            throw new \Exception('Profile not found');
        }

        $profile->update(['avatar' => $filePath]);
        return $profile->toArray();
    }
}