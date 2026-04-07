<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();

            // FK tới bảng orders
            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();

            // FK tới bảng productvariant
            $table->foreignId('variant_id')
                ->constrained('productvariant')
                ->cascadeOnDelete();

            // FK tới bảng lens (nullable nếu không kèm tròng)
            $table->foreignId('lens_id')
                ->nullable()
                ->constrained('lens')
                ->nullOnDelete();

            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);

            // Thời gian tạo & cập nhật
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
