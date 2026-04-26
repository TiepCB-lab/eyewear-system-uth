<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Application\AdminService;
use Core\ApiResponse;
use Throwable;

class AdminController extends BaseController
{
    private AdminService $adminService;

    public function __construct(AdminService $adminService = null)
    {
        $this->adminService = $adminService ?? new AdminService();
    }

    private function requireAdmin()
    {
        if (!$this->isStaff()) {
            return ApiResponse::forbidden();
        }
        return true;
    }

    /**
     * GET /api/v1/admin/staff - List all staff
     */
    public function listStaff()
    {
        if ($this->requireAdmin() !== true) return $this->requireAdmin();

        try {
            $filters = $_GET;
            $data = $this->adminService->getAllStaff($filters);
            return ApiResponse::success($data);
        } catch (Throwable $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }

    /**
     * GET /api/v1/admin/staff/{id} - Get staff by ID
     */
    public function getStaff()
    {
        if ($this->requireAdmin() !== true) return $this->requireAdmin();

        $userId = (int) ($this->query('id') ?? 0);
        if ($userId <= 0) {
            return ApiResponse::validationError('Invalid staff ID');
        }

        try {
            $staff = $this->adminService->getStaffById($userId);
            if (!$staff) {
                return ApiResponse::notFound('Staff not found');
            }
            return ApiResponse::success($staff);
        } catch (Throwable $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }

    /**
     * POST /api/v1/admin/staff - Create staff account
     */
    public function createStaff()
    {
        if ($this->requireAdmin() !== true) return $this->requireAdmin();

        $input = $this->getJsonInput();

        if (empty($input['full_name']) || empty($input['email']) || empty($input['password']) || empty($input['role_id'])) {
            return ApiResponse::validationError('Missing required fields: full_name, email, password, role_id');
        }

        try {
            $staff = $this->adminService->createStaff($input);
            return ApiResponse::created($staff, 'Staff account created successfully');
        } catch (Throwable $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * PUT /api/v1/admin/staff/{id} - Update staff (status/role)
     */
    public function updateStaff()
    {
        if ($this->requireAdmin() !== true) return $this->requireAdmin();

        $userId = (int) ($this->query('id') ?? 0);
        if ($userId <= 0) {
            return ApiResponse::validationError('Invalid staff ID');
        }

        $input = $this->getJsonInput();

        try {
            if (!empty($input['status'])) {
                $staff = $this->adminService->updateStaffStatus($userId, $input['status']);
                return ApiResponse::success($staff, 'Staff status updated');
            }

            if (!empty($input['role_id'])) {
                $staff = $this->adminService->updateStaffRole($userId, (int) $input['role_id']);
                return ApiResponse::success($staff, 'Staff role updated');
            }

            return ApiResponse::validationError('Provide status or role_id to update');
        } catch (Throwable $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * DELETE /api/v1/admin/staff/{id} - Delete/deactivate staff
     */
    public function deleteStaff()
    {
        if ($this->requireAdmin() !== true) return $this->requireAdmin();

        $userId = (int) ($this->query('id') ?? 0);
        if ($userId <= 0) {
            return ApiResponse::validationError('Invalid staff ID');
        }

        try {
            $this->adminService->deleteStaff($userId);
            return ApiResponse::success(null, 'Staff deleted successfully');
        } catch (Throwable $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * GET /api/v1/admin/roles - List all roles
     */
    public function listRoles()
    {
        if ($this->requireAdmin() !== true) return $this->requireAdmin();

        try {
            $roles = $this->adminService->getAllRoles();
            return ApiResponse::success($roles);
        } catch (Throwable $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }

    /**
     * POST /api/v1/admin/config - Set system configuration
     */
    public function setConfig()
    {
        if ($this->requireAdmin() !== true) return $this->requireAdmin();

        $input = $this->getJsonInput();

        if (empty($input['key']) || empty($input['value'])) {
            return ApiResponse::validationError('Missing required fields: key, value');
        }

        try {
            $result = $this->adminService->setSystemConfig($input['key'], $input['value']);
            return ApiResponse::created($result, 'Configuration stored');
        } catch (Throwable $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * GET /api/v1/admin/config - Get system configuration
     */
    public function getConfig()
    {
        if ($this->requireAdmin() !== true) return $this->requireAdmin();

        try {
            $key = $this->query('key');
            $config = $this->adminService->getSystemConfig($key);
            return ApiResponse::success($config);
        } catch (Throwable $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }

    /**
     * POST /api/v1/admin/vouchers - Create voucher/promotion
     */
    public function createVoucher()
    {
        if ($this->requireAdmin() !== true) return $this->requireAdmin();

        $input = $this->getJsonInput();

        $required = ['code', 'title', 'discount_type', 'discount_value', 'starts_at', 'ends_at'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                return ApiResponse::validationError("Missing required field: $field");
            }
        }

        try {
            $voucher = $this->adminService->createVoucher($input);
            return ApiResponse::created($voucher, 'Voucher created successfully');
        } catch (Throwable $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * GET /api/v1/admin/vouchers - List all vouchers
     */
    public function listVouchers()
    {
        if ($this->requireAdmin() !== true) return $this->requireAdmin();

        try {
            $filters = $_GET;
            $data = $this->adminService->getAllVouchers($filters);
            return ApiResponse::success($data);
        } catch (Throwable $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }

    /**
     * PUT /api/v1/admin/vouchers/{id} - Update voucher
     */
    public function updateVoucher()
    {
        if ($this->requireAdmin() !== true) return $this->requireAdmin();

        $voucherId = (int) ($this->query('id') ?? 0);
        if ($voucherId <= 0) {
            return ApiResponse::validationError('Invalid voucher ID');
        }

        $input = $this->getJsonInput();

        try {
            $voucher = $this->adminService->updateVoucher($voucherId, $input);
            return ApiResponse::success($voucher, 'Voucher updated successfully');
        } catch (Throwable $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * DELETE /api/v1/admin/vouchers/{id} - Deactivate voucher
     */
    public function deleteVoucher()
    {
        if ($this->requireAdmin() !== true) return $this->requireAdmin();

        $voucherId = (int) ($this->query('id') ?? 0);
        if ($voucherId <= 0) {
            return ApiResponse::validationError('Invalid voucher ID');
        }

        try {
            $this->adminService->deactivateVoucher($voucherId);
            return ApiResponse::success(null, 'Voucher deactivated successfully');
        } catch (Throwable $e) {
            return ApiResponse::error($e->getMessage());
        }
    }
}