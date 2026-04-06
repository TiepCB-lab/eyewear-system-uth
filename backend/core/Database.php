<?php

namespace Core;

use PDO;

class Database
{
    private static ?PDO $pdo = null;

    public static function setInstance(PDO $pdo): void
    {
        self::$pdo = $pdo;
    }

    public static function getInstance(): PDO
    {
        if (self::$pdo === null) {
            throw new \RuntimeException('Database connection not initialized.');
        }
        return self::$pdo;
    }
}
