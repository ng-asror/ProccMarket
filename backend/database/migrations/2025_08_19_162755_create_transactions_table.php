<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['deposit', 'withdrawal', 'access_purchase']);
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('pending'); // pending, completed, rejected
            $table->string('transaction_id')->nullable(); // Payment gateway ID
            $table->nullableMorphs('payable'); // polymorphic: payable_type + payable_id
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('transactions');
    }
};