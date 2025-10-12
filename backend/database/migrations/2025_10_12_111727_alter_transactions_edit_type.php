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
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('type')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Oldin escrow yozuvlarini yo‘qotamiz yoki o‘zgartiramiz
            DB::table('transactions')
                ->where('type', 'escrow')
                ->update(['type' => 'admin_adjustment']);
            
            $table->enum('type', [
                'deposit',
                'withdrawal',
                'access_purchase',
                'admin_adjustment'
            ])->change();
        });
    }

};
