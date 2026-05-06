<?php

namespace App\Application;

use Core\Database;

class DashboardService
{
	public function getSummary(): array
	{
		$db = Database::getInstance();

		$revenue = (float) $db->query("SELECT COALESCE(SUM(total_amount), 0) FROM `order` WHERE status IN ('paid', 'processing', 'shipped', 'delivered')")->fetchColumn();
		$activeOrders = (int) $db->query("SELECT COUNT(*) FROM `order` WHERE status IN ('pending', 'paid', 'processing', 'shipped')")->fetchColumn();
		$paidOrders = (int) $db->query("SELECT COUNT(*) FROM `order` WHERE status IN ('paid', 'processing', 'shipped', 'delivered')")->fetchColumn();
		$averageOrderValue = $paidOrders > 0 ? $revenue / $paidOrders : 0;

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

		$topCategoriesStmt = $db->query(
			"SELECT c.id AS category_id, c.name AS category_name, SUM(oi.quantity) AS units_sold, SUM(oi.line_total) AS revenue
			 FROM orderitem oi
			 INNER JOIN `order` o ON o.id = oi.order_id
			 INNER JOIN productvariant pv ON pv.id = oi.productvariant_id
			 INNER JOIN product p ON p.id = pv.product_id
			 LEFT JOIN category c ON c.id = p.category_id
			 WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')
			 GROUP BY c.id, c.name
			 ORDER BY units_sold DESC, revenue DESC
			 LIMIT 5"
		);

		$topCategories = $topCategoriesStmt->fetchAll(\PDO::FETCH_ASSOC);

		return [
			'revenue' => $revenue,
			'average_order_value' => $averageOrderValue,
			'active_orders' => $activeOrders,
			'paid_orders' => $paidOrders,
			'conversion_rate' => $activeOrders > 0 ? round(($paidOrders / $activeOrders) * 100, 2) : 0,
			'top_products' => $topProducts,
			'top_categories' => $topCategories,
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

		// Calculate average turnaround time in hours (from placed_at to delivered_at)
		$avgTurnaround = (float) $db->query(
			"SELECT AVG(TIMESTAMPDIFF(HOUR, placed_at, updated_at)) 
			 FROM `order` 
			 WHERE status = 'delivered'"
		)->fetchColumn();

		return [
			'production_steps' => $productionStepsStmt->fetchAll(\PDO::FETCH_ASSOC),
			'shipment_statuses' => $shipmentStatsStmt->fetchAll(\PDO::FETCH_ASSOC),
			'pending_shipments' => (int) $db->query("SELECT COUNT(*) FROM shipment WHERE shipping_status IN ('pending', 'packed')")->fetchColumn(),
			'avg_turnaround_hours' => $avgTurnaround ?: 0
		];
	}

	public function getSalesByDay(int $days = 30): array
	{
		$db = Database::getInstance();
		$days = max(1, (int) $days);
		$stmt = $db->query("
			SELECT DATE(placed_at) as date, SUM(total_amount) as revenue, COUNT(*) as orders
			FROM `order`
			WHERE placed_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)
			  AND status NOT IN ('cancelled')
			GROUP BY DATE(placed_at)
			ORDER BY date ASC
		");
		return $stmt->fetchAll(\PDO::FETCH_ASSOC);
	}
}
