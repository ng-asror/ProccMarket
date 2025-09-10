<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('withdrawal_requests', function (Blueprint $table) {
            // requisites: string → text
            $table->text('requisites')->change();

            // processed_at: yangi ustun
            $table->timestamp('processed_at')->nullable();

            // indexlar
            $table->index(['user_id', 'status']);
            $table->index('created_at');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('withdrawal_requests', function (Blueprint $table) {
            // revert changes
            $table->string('requisites')->change();
            $table->dropColumn('processed_at');

            $table->dropIndex(['withdrawal_requests_user_id_status_index']);
            $table->dropIndex(['withdrawal_requests_created_at_index']);
            $table->dropIndex(['withdrawal_requests_status_index']);
        });
    }
};
