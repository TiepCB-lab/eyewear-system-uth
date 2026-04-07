<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();

            // FK tới bảng user
            $table->foreignId('user_id')
                ->constrained('user')
                ->cascadeOnDelete();

            // FK tới bảng productvariant
            $table->foreignId('variant_id')
                ->constrained('productvariant')
                ->cascadeOnDelete();

            // FK tới bảng lens (nullable)
            $table->foreignId('lens_id')
                ->nullable()
                ->constrained('lens')
                ->nullOnDelete();

            $table->integer('quantity');

            // Thời gian tạo & cập nhật
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_items');
    }
};
