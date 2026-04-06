<?php

// TODO: Expose product listing, detail, filter, and admin product CRUD endpoints.
public function getAllProducts() {
    // Câu lệnh SQL lấy sản phẩm và tên danh mục tương ứng
    $sql = "SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id";
    
    $stmt = $this->db->query($sql);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($products);
    exit;
}