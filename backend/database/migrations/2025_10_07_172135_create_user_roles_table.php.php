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
        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('role_id')->constrained()->onDelete('cascade');
            $table->decimal('purchase_price', 10, 2);
            $table->foreignId('transaction_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamp('purchased_at');
            $table->timestamps();

            // Prevent duplicate role purchases
            $table->unique(['user_id', 'role_id']);
            
            // Index for faster queries
            $table->index(['user_id', 'purchased_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_roles');
    }
};