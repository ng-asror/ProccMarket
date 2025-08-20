<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('withdrawal_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 10, 0);
            $table->string('requisites'); // Bank details, etc.
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->text('reason')->nullable(); // For rejection
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('withdrawal_requests');
    }
};