<?php
namespace App\Http\Controllers\Api\V1;

use App\Application\AddressService;
use App\Application\AuthService;
use Exception;

class AddressController {
    private AddressService $addressService;
    private AuthService $authService;

    public function __construct(AddressService $addressService, AuthService $authService) {
        $this->addressService = $addressService;
        $this->authService = $authService;
    }

    public function index() {
        try {
            $user = $this->authService->getCurrentUser();
            if (!$user) {
                http_response_code(401);
                echo json_encode(['message' => 'Unauthorized']);
                return;
            }

            $addresses = $this->addressService->getAddresses($user['id']);
            echo json_encode(['status' => 'success', 'data' => $addresses]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function store() {
        try {
            $user = $this->authService->getCurrentUser();
            if (!$user) {
                http_response_code(401);
                echo json_encode(['message' => 'Unauthorized']);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $addressId = $this->addressService->addAddress($user['id'], $data);
            
            http_response_code(201);
            echo json_encode(['status' => 'success', 'data' => ['id' => $addressId]]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function update($id) {
        try {
            $user = $this->authService->getCurrentUser();
            if (!$user) {
                http_response_code(401);
                echo json_encode(['message' => 'Unauthorized']);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $this->addressService->updateAddress($user['id'], (int)$id, $data);
            
            echo json_encode(['status' => 'success', 'message' => 'Address updated']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function destroy($id) {
        try {
            $user = $this->authService->getCurrentUser();
            if (!$user) {
                http_response_code(401);
                echo json_encode(['message' => 'Unauthorized']);
                return;
            }

            $this->addressService->deleteAddress($user['id'], (int)$id);
            echo json_encode(['status' => 'success', 'message' => 'Address deleted']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}
