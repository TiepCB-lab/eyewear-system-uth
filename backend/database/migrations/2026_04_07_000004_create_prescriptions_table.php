<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();

            // FK tới bảng order_items
            $table->foreignId('order_item_id')
                ->constrained('order_items')
                ->cascadeOnDelete();

            // Phải (OD)
            $table->decimal('od_sphere', 5, 2)->nullable();
            $table->decimal('od_cylinder', 5, 2)->nullable();
            $table->integer('od_axis')->nullable();
            $table->decimal('od_add', 5, 2)->nullable();

            // Trái (OS)
            $table->decimal('os_sphere', 5, 2)->nullable();
            $table->decimal('os_cylinder', 5, 2)->nullable();
            $table->integer('os_axis')->nullable();
            $table->decimal('os_add', 5, 2)->nullable();

            // Khoảng cách đồng tử (Pupillary Distance)
            $table->decimal('pd', 5, 2)->nullable();

            // Thời gian tạo & cập nhật
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};
