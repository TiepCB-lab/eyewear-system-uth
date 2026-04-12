<?php

namespace App\Http\Controllers\Api\V1;

use Core\Database;
use PDO;

class ProductController
{
    /**
     * Expose product listing for Cart/Shopping testing.
     * (Shared/Dependency for Member 3)
     */
    public function index()
    {
        $db = Database::getInstance();
        
        $sql = "SELECT p.*, c.name as category_name 
                FROM product p 
                LEFT JOIN category c ON p.category_id = c.id";
        
        $stmt = $db->query($sql);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return $products;
    }
}