<?php
$host = "localhost";
$dbname = "eyewear_system";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    // Thiết lập chế độ báo lỗi để dễ fix code
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // echo "Kết nối thành công!"; // Mở dòng này nếu muốn test thử
} catch(PDOException $e) {
    die("Lỗi kết nối database: " . $e->getMessage());
}
?>