<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Support;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_transactions', function (Blueprint $table) {
            $table->integer('revision_count')->default(0)->after('status');
            $table->text('revision_reason')->nullable()->after('revision_count');
            $table->timestamp('revision_requested_at')->nullable()->after('revision_reason');
            $table->foreignId('revision_requested_by')->nullable()->constrained('users')->after('revision_requested_at');
        });
    }

    public function down(): void
    {
        Schema::table('order_transactions', function (Blueprint $table) {
            $table->dropForeign(['revision_requested_by']);
            $table->dropColumn(['revision_count', 'revision_reason', 'revision_requested_at', 'revision_requested_by']);
        });
    }
};