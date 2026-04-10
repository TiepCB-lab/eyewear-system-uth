<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('production_step', [
                'lens_cutting',
                'frame_mounting',
                'qc_inspection',
                'packaging',
                'ready_to_ship',
            ])->nullable()->after('status');

            $table->foreignId('verified_by')
                ->nullable()
                ->after('payment_status')
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('verified_at')
                ->nullable()
                ->after('verified_by');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['verified_by']);
            $table->dropColumn(['production_step', 'verified_by', 'verified_at']);
        });
    }
};
