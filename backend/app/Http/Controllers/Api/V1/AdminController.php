<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\AdminService;

class AdminController
{
private AdminService $adminService;

public function __construct(AdminService $adminService = null)
{
$this->adminService = $adminService ?? new AdminService();
}

/**
 * GET /api/v1/admin/staff - List all staff
 */
public function listStaff(): array
{
try {
$filters = [];
parse_str($_SERVER['QUERY_STRING'] ?? '', $filters);

$data = $this->adminService->getAllStaff($filters);
return ['data' => $data];
} catch (\Throwable $e) {
http_response_code(500);
return ['message' => $e->getMessage()];
}
}

/**
 * GET /api/v1/admin/staff/{id} - Get staff by ID
 */
public function getStaff(): array
{
$userId = (int) ($this->getUriParam('id') ?? 0);
if ($userId <= 0) {
http_response_code(400);
return ['message' => 'Invalid staff ID'];
}

try {
$staff = $this->adminService->getStaffById($userId);
if (!$staff) {
http_response_code(404);
return ['message' => 'Staff not found'];
}
return ['data' => $staff];
} catch (\Throwable $e) {
http_response_code(500);
return ['message' => $e->getMessage()];
}
}

/**
 * POST /api/v1/admin/staff - Create staff account
 */
public function createStaff(): array
{
$input = $this->getJsonInput();

if (empty($input['full_name']) || empty($input['email']) || empty($input['password']) || empty($input['role_id'])) {
http_response_code(400);
return ['message' => 'Missing required fields: full_name, email, password, role_id'];
}

try {
$staff = $this->adminService->createStaff($input);
http_response_code(201);
return [
'message' => 'Staff account created successfully',
'data' => $staff,
];
} catch (\Throwable $e) {
http_response_code(400);
return ['message' => $e->getMessage()];
}
}

/**
 * PUT /api/v1/admin/staff/{id} - Update staff (status/role)
 */
public function updateStaff(): array
{
$userId = (int) ($this->getUriParam('id') ?? 0);
if ($userId <= 0) {
http_response_code(400);
return ['message' => 'Invalid staff ID'];
}

$input = $this->getJsonInput();

try {
if (!empty($input['status'])) {
$staff = $this->adminService->updateStaffStatus($userId, $input['status']);
return ['message' => 'Staff status updated', 'data' => $staff];
}

if (!empty($input['role_id'])) {
$staff = $this->adminService->updateStaffRole($userId, (int) $input['role_id']);
return ['message' => 'Staff role updated', 'data' => $staff];
}

http_response_code(400);
return ['message' => 'Provide status or role_id to update'];
} catch (\Throwable $e) {
http_response_code(400);
return ['message' => $e->getMessage()];
}
}

/**
 * DELETE /api/v1/admin/staff/{id} - Delete/deactivate staff
 */
public function deleteStaff(): array
{
$userId = (int) ($this->getUriParam('id') ?? 0);
if ($userId <= 0) {
http_response_code(400);
return ['message' => 'Invalid staff ID'];
}

try {
$this->adminService->deleteStaff($userId);
return ['message' => 'Staff deleted successfully'];
} catch (\Throwable $e) {
http_response_code(400);
return ['message' => $e->getMessage()];
}
}

/**
 * GET /api/v1/admin/roles - List all roles
 */
public function listRoles(): array
{
try {
$roles = $this->adminService->getAllRoles();
return ['data' => $roles];
} catch (\Throwable $e) {
http_response_code(500);
return ['message' => $e->getMessage()];
}
}

/**
 * GET /api/v1/admin/roles/{id} - Get role by ID
 */
public function getRole(): array
{
$roleId = (int) ($this->getUriParam('id') ?? 0);
if ($roleId <= 0) {
http_response_code(400);
return ['message' => 'Invalid role ID'];
}

try {
$role = $this->adminService->getRoleById($roleId);
if (!$role) {
http_response_code(404);
return ['message' => 'Role not found'];
}
return ['data' => $role];
} catch (\Throwable $e) {
http_response_code(500);
return ['message' => $e->getMessage()];
}
}

/**
 * POST /api/v1/admin/config - Set system configuration
 */
public function setConfig(): array
{
$input = $this->getJsonInput();

if (empty($input['key']) || empty($input['value'])) {
http_response_code(400);
return ['message' => 'Missing required fields: key, value'];
}

try {
$result = $this->adminService->setSystemConfig($input['key'], $input['value']);
http_response_code(201);
return ['message' => 'Configuration stored', 'data' => $result];
} catch (\Throwable $e) {
http_response_code(400);
return ['message' => $e->getMessage()];
}
}

/**
 * GET /api/v1/admin/config - Get system configuration
 */
public function getConfig(): array
{
try {
$key = $_GET['key'] ?? null;
$config = $this->adminService->getSystemConfig($key);
return ['data' => $config];
} catch (\Throwable $e) {
http_response_code(500);
return ['message' => $e->getMessage()];
}
}

/**
 * POST /api/v1/admin/vouchers - Create voucher/promotion
 */
public function createVoucher(): array
{
$input = $this->getJsonInput();

$required = ['code', 'title', 'discount_type', 'discount_value', 'starts_at', 'ends_at'];
foreach ($required as $field) {
if (empty($input[$field])) {
http_response_code(400);
return ['message' => "Missing required field: $field"];
}
}

try {
$voucher = $this->adminService->createVoucher($input);
http_response_code(201);
return [
'message' => 'Voucher created successfully',
'data' => $voucher,
];
} catch (\Throwable $e) {
http_response_code(400);
return ['message' => $e->getMessage()];
}
}

/**
 * GET /api/v1/admin/vouchers - List all vouchers
 */
public function listVouchers(): array
{
try {
$filters = [];
parse_str($_SERVER['QUERY_STRING'] ?? '', $filters);

$data = $this->adminService->getAllVouchers($filters);
return ['data' => $data];
} catch (\Throwable $e) {
http_response_code(500);
return ['message' => $e->getMessage()];
}
}

/**
 * GET /api/v1/admin/vouchers/{id} - Get voucher by ID
 */
public function getVoucher(): array
{
$voucherId = (int) ($this->getUriParam('id') ?? 0);
if ($voucherId <= 0) {
http_response_code(400);
return ['message' => 'Invalid voucher ID'];
}

try {
$voucher = $this->adminService->getVoucherById($voucherId);
if (!$voucher) {
http_response_code(404);
return ['message' => 'Voucher not found'];
}
return ['data' => $voucher];
} catch (\Throwable $e) {
http_response_code(500);
return ['message' => $e->getMessage()];
}
}

/**
 * PUT /api/v1/admin/vouchers/{id} - Update voucher
 */
public function updateVoucher(): array
{
$voucherId = (int) ($this->getUriParam('id') ?? 0);
if ($voucherId <= 0) {
http_response_code(400);
return ['message' => 'Invalid voucher ID'];
}

$input = $this->getJsonInput();

try {
$voucher = $this->adminService->updateVoucher($voucherId, $input);
return ['message' => 'Voucher updated successfully', 'data' => $voucher];
} catch (\Throwable $e) {
http_response_code(400);
return ['message' => $e->getMessage()];
}
}

/**
 * DELETE /api/v1/admin/vouchers/{id} - Deactivate voucher
 */
public function deleteVoucher(): array
{
$voucherId = (int) ($this->getUriParam('id') ?? 0);
if ($voucherId <= 0) {
http_response_code(400);
return ['message' => 'Invalid voucher ID'];
}

try {
$this->adminService->deactivateVoucher($voucherId);
return ['message' => 'Voucher deactivated successfully'];
} catch (\Throwable $e) {
http_response_code(400);
return ['message' => $e->getMessage()];
}
}

/**
 * Extract URI parameter from route
 */
private function getUriParam(string $paramName): ?string
{
// Router passes parameters via attribute or header
return $_GET[$paramName] ?? null;
}

/**
 * Parse JSON input from request body
 */
private function getJsonInput(): array
{
$input = json_decode(file_get_contents('php://input'), true);
return is_array($input) ? $input : [];
}
}