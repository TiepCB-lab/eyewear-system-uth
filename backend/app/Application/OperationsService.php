<?php

namespace App\Application;

use App\Models\Order;
use App\Models\Shipment;
use Core\Database;

class OperationsService
{
	private const PRODUCTION_FLOW = [
		'lens_cutting',
		'frame_mounting',
		'qc_inspection',
		'packaging',
		'ready_to_ship',
	];

	public function listProductionQueue(): array
	{
		$db = Database::getInstance();
		$stmt = $db->query(
			"SELECT o.*, s.id AS shipment_id, s.courier, s.tracking_number, s.shipping_status
			 FROM `order` o
			 LEFT JOIN shipment s ON s.order_id = o.id
			 WHERE o.status IN ('pending', 'paid', 'processing', 'shipped')
			 ORDER BY o.created_at ASC"
		);

		return $stmt->fetchAll(\PDO::FETCH_ASSOC);
	}

	public function advanceProductionStep(int $orderId): array
	{
		$order = Order::find($orderId);

		if (!$order) {
			throw new \Exception('Order not found');
		}

		$currentStep = $order->production_step ?: self::PRODUCTION_FLOW[0];
		$nextStep = $this->getNextProductionStep($currentStep);

		if ($nextStep === null) {
			throw new \Exception('Order is already ready to ship');
		}

		$order->update([
			'status' => 'processing',
			'production_step' => $nextStep,
		]);

		return $this->getOrderDetails($orderId);
	}

	public function createShipment(int $orderId, array $payload = []): array
	{
		$order = Order::find($orderId);

		if (!$order) {
			throw new \Exception('Order not found');
		}

		if ($order->shipment()) {
			throw new \Exception('Shipment already exists for this order');
		}

		$shippingStatus = $payload['shipping_status'] ?? 'pending';
		$now = date('Y-m-d H:i:s');

		$shipment = Shipment::create([
			'order_id' => $orderId,
			'courier' => $this->normalizeString($payload['courier'] ?? null),
			'tracking_number' => $this->normalizeString($payload['tracking_number'] ?? null) ?: $this->generateTrackingNumber($orderId),
			'shipping_status' => $shippingStatus,
			'shipped_at' => in_array($shippingStatus, ['shipping', 'delivered'], true) ? $now : null,
			'delivered_at' => $shippingStatus === 'delivered' ? $now : null,
		]);

		$order->update([
			'status' => $shippingStatus === 'delivered' ? 'delivered' : 'shipped',
			'production_step' => 'ready_to_ship',
		]);

		return $this->getShipmentDetails((int) $shipment->id);
	}

	public function updateShipment(int $shipmentId, array $payload): array
	{
		$shipment = Shipment::find($shipmentId);

		if (!$shipment) {
			throw new \Exception('Shipment not found');
		}

		$updates = [];

		if (array_key_exists('courier', $payload)) {
			$updates['courier'] = $this->normalizeString($payload['courier']);
		}

		if (array_key_exists('tracking_number', $payload)) {
			$updates['tracking_number'] = $this->normalizeString($payload['tracking_number']);
		}

		if (array_key_exists('shipping_status', $payload)) {
			$shippingStatus = $payload['shipping_status'];
			$updates['shipping_status'] = $shippingStatus;

			if ($shippingStatus === 'shipping' && !$shipment->shipped_at) {
				$updates['shipped_at'] = date('Y-m-d H:i:s');
			}

			if ($shippingStatus === 'delivered') {
				if (!$shipment->shipped_at) {
					$updates['shipped_at'] = date('Y-m-d H:i:s');
				}
				$updates['delivered_at'] = date('Y-m-d H:i:s');
			}
		}

		if (!empty($updates)) {
			$shipment->update($updates);
		}

		$order = $shipment->order();
		if ($order) {
			if (($updates['shipping_status'] ?? $shipment->shipping_status) === 'delivered') {
				$order->update(['status' => 'delivered']);
			} elseif (($updates['shipping_status'] ?? $shipment->shipping_status) === 'shipping') {
				$order->update(['status' => 'shipped']);
			}
		}

		return $this->getShipmentDetails($shipmentId);
	}

	private function getNextProductionStep(string $currentStep): ?string
	{
		$index = array_search($currentStep, self::PRODUCTION_FLOW, true);
		if ($index === false) {
			return self::PRODUCTION_FLOW[0];
		}

		return self::PRODUCTION_FLOW[$index + 1] ?? null;
	}

	private function normalizeString($value): ?string
	{
		$value = is_string($value) ? trim($value) : '';
		return $value !== '' ? $value : null;
	}

	private function generateTrackingNumber(int $orderId): string
	{
		return 'TRK-' . strtoupper(substr(hash('sha256', $orderId . '|' . microtime(true) . '|' . random_int(1000, 9999)), 0, 12));
	}

	private function getOrderDetails(int $orderId): array
	{
		$order = Order::find($orderId);
		if (!$order) {
			throw new \Exception('Order not found');
		}

		$data = $order->toArray();
		$shipment = $order->shipment();
		if ($shipment) {
			$data['shipment'] = $shipment->toArray();
		}

		return $data;
	}

	private function getShipmentDetails(int $shipmentId): array
	{
		$shipment = Shipment::find($shipmentId);
		if (!$shipment) {
			throw new \Exception('Shipment not found');
		}

		$data = $shipment->toArray();
		$order = $shipment->order();
		if ($order) {
			$data['order'] = $order->toArray();
		}

		return $data;
	}
}