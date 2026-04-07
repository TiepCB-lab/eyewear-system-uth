<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            // FK tới bảng user
            $table->foreignId('user_id')
                ->constrained('user')
                ->cascadeOnDelete();

            $table->decimal('total_amount', 12, 2);
            $table->enum('status', [
                'pending',
                'verified',
                'in_production',
                'shipped',
                'delivered',
                'cancelled'
            ])->default('pending');

            $table->string('payment_status')->default('unpaid');

            // Thời gian tạo & cập nhật
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
