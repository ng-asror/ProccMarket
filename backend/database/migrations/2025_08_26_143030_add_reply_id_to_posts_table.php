<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('posts', 'reply_id')) {
            Schema::table('posts', function (Blueprint $table) {
                $table->foreignId('reply_id')->nullable()->constrained('posts')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(columns: 'reply_id');
        });
    }
};