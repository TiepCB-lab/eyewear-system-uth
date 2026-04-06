<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('ticket_replies', function (Blueprint $table) {
            $table->id();

            // FK tới bảng supportticket
            $table->foreignId('ticket_id')
                  ->constrained('supportticket')
                  ->cascadeOnDelete();

            // FK tới bảng user
            $table->foreignId('user_id')
                  ->constrained('user')
                  ->cascadeOnDelete();

            // Nội dung trả lời
            $table->text('message');

            // Thời gian tạo & cập nhật
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('ticket_replies');
    }
