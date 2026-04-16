<?php

namespace App\Application;

use Core\Database;

class DashboardService
{
	public function getSummary(): array
	{
		$db = Database::getInstance();

		$revenue = (float) $db->query("SELECT COALESCE(SUM(amount), 0) FROM payment WHERE status = 'paid'")->fetchColumn();
		$activeOrders = (int) $db->query("SELECT COUNT(*) FROM `order` WHERE status IN ('pending', 'paid', 'processing', 'shipped')")->fetchColumn();
		$paidOrders = (int) $db->query("SELECT COUNT(*) FROM `order` WHERE status IN ('paid', 'processing', 'shipped', 'delivered')")->fetchColumn();

		$topProductsStmt = $db->query(
			"SELECT p.id AS product_id, p.name AS product_name, SUM(oi.quantity) AS units_sold, SUM(oi.line_total) AS revenue
			 FROM orderitem oi
			 INNER JOIN `order` o ON o.id = oi.order_id
			 INNER JOIN productvariant pv ON pv.id = oi.productvariant_id
			 INNER JOIN product p ON p.id = pv.product_id
			 WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')
			 GROUP BY p.id, p.name
			 ORDER BY units_sold DESC, revenue DESC
			 LIMIT 5"
		);

		$topProducts = $topProductsStmt->fetchAll(\PDO::FETCH_ASSOC);

		return [
			'revenue' => $revenue,
			'active_orders' => $activeOrders,
			'paid_orders' => $paidOrders,
			'top_products' => $topProducts,
		];
	}

	public function getOperationsOverview(): array
	{
		$db = Database::getInstance();

		$productionStepsStmt = $db->query(
			"SELECT COALESCE(production_step, 'unassigned') AS production_step, COUNT(*) AS total
			 FROM `order`
			 WHERE status IN ('pending', 'paid', 'processing')
			 GROUP BY COALESCE(production_step, 'unassigned')"
		);

		$shipmentStatsStmt = $db->query(
			"SELECT shipping_status, COUNT(*) AS total
			 FROM shipment
			 GROUP BY shipping_status"
		);

		return [
			'production_steps' => $productionStepsStmt->fetchAll(\PDO::FETCH_ASSOC),
			'shipment_statuses' => $shipmentStatsStmt->fetchAll(\PDO::FETCH_ASSOC),
			'pending_shipments' => (int) $db->query("SELECT COUNT(*) FROM shipment WHERE shipping_status IN ('pending', 'packed')")->fetchColumn(),
		];
	}
}