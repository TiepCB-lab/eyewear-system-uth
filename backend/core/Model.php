<?php

namespace Core;

/**
 * Base Model — Provides shared database access helpers for all models.
 * 
 * This replaces Laravel's Eloquent Model. All app models should extend this class
 * and use Core\Database for direct SQL queries.
 */
abstract class Model
{
    /**
     * Table name in the database.
     * Override this in child models if the table name differs from convention.
     */
    protected static string $table = '';

    /**
     * The model's attributes (column => value).
     */
    protected array $attributes = [];

    public function __construct(array $attributes = [])
    {
        $this->attributes = $attributes;
    }

    /**
     * Magic getter for attribute access: $model->name
     */
    public function __get(string $key)
    {
        return $this->attributes[$key] ?? null;
    }

    /**
     * Magic setter for attribute assignment: $model->name = 'value'
     */
    public function __set(string $key, $value): void
    {
        $this->attributes[$key] = $value;
    }

    /**
     * Check if an attribute exists.
     */
    public function __isset(string $key): bool
    {
        return isset($this->attributes[$key]);
    }

    /**
     * Get all attributes as an array.
     */
    public function toArray(): array
    {
        return $this->attributes;
    }

    /**
     * Resolve the table name for a model.
     */
    public static function getTable(): string
    {
        if (static::$table !== '') {
            return static::$table;
        }
        // Convention: class name in lowercase (e.g., User -> user, CartItem -> cartitem)
        return strtolower((new \ReflectionClass(static::class))->getShortName());
    }

    /**
     * Get the PDO database instance.
     */
    protected static function db(): \PDO
    {
        return Database::getInstance();
    }

    /**
     * Find a single record by its primary key.
     */
    public static function find(int $id): ?self
    {
        $table = static::getTable();
        $stmt = static::db()->prepare("SELECT * FROM `{$table}` WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $row ? new static($row) : null;
    }

    /**
     * Get all records from the table.
     */
    public static function all(): array
    {
        $table = static::getTable();
        $stmt = static::db()->query("SELECT * FROM `{$table}`");
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return array_map(fn($row) => new static($row), $rows);
    }

    /**
     * Find records matching a simple WHERE condition.
     * Example: User::where('email', $email)
     */
    public static function where(string $column, $value): array
    {
        $table = static::getTable();
        $stmt = static::db()->prepare("SELECT * FROM `{$table}` WHERE `{$column}` = ?");
        $stmt->execute([$value]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return array_map(fn($row) => new static($row), $rows);
    }

    /**
     * Find the first record matching a simple WHERE condition.
     * Example: User::firstWhere('email', $email)
     */
    public static function firstWhere(string $column, $value): ?self
    {
        $table = static::getTable();
        $stmt = static::db()->prepare("SELECT * FROM `{$table}` WHERE `{$column}` = ? LIMIT 1");
        $stmt->execute([$value]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $row ? new static($row) : null;
    }

    /**
     * Insert a new record and return the model instance.
     * Example: User::create(['name' => 'John', 'email' => 'john@example.com'])
     */
    public static function create(array $data): self
    {
        $table = static::getTable();
        $columns = implode(', ', array_map(fn($col) => "`{$col}`", array_keys($data)));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));

        $stmt = static::db()->prepare("INSERT INTO `{$table}` ({$columns}) VALUES ({$placeholders})");
        $stmt->execute(array_values($data));

        $data['id'] = static::db()->lastInsertId();
        return new static($data);
    }

    /**
     * Update the current model's record in the database.
     * Example: $user->update(['name' => 'New Name'])
     */
    public function update(array $data): bool
    {
        $table = static::getTable();
        $sets = implode(', ', array_map(fn($col) => "`{$col}` = ?", array_keys($data)));

        $stmt = static::db()->prepare("UPDATE `{$table}` SET {$sets} WHERE id = ?");
        $result = $stmt->execute([...array_values($data), $this->attributes['id']]);

        // Merge updated data into attributes
        $this->attributes = array_merge($this->attributes, $data);
        return $result;
    }

    /**
     * Delete the current model's record from the database.
     */
    public function delete(): bool
    {
        $table = static::getTable();
        $stmt = static::db()->prepare("DELETE FROM `{$table}` WHERE id = ?");
        return $stmt->execute([$this->attributes['id']]);
    }
}
