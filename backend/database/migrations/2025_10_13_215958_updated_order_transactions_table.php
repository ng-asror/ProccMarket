<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_transactions', function (Blueprint $table) {
            // Yangi ustunlar qo'shamiz
            $table->foreignId('client_id')->nullable()->after('executor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('freelancer_id')->nullable()->after('client_id')->constrained('users')->onDelete('cascade');
            
            // Cancellation request uchun
            $table->foreignId('cancellation_requested_by')->nullable()->after('cancelled_by')->constrained('users')->onDelete('set null');
            $table->timestamp('cancellation_requested_at')->nullable()->after('cancellation_requested_by');
        });
    }

    public function down(): void
    {
        Schema::table('order_transactions', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
            $table->dropForeign(['freelancer_id']);
            $table->dropForeign(['cancellation_requested_by']);
            
            $table->dropColumn([
                'client_id',
                'freelancer_id',
                'cancellation_requested_by',
                'cancellation_requested_at',
            ]);
        });
    }
};