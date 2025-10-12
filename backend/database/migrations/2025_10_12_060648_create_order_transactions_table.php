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
        Schema::create('order_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('conversations')->onDelete('cascade');
            $table->foreignId('message_id')->nullable()->constrained('messages')->onDelete('set null');
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('executor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('transaction_id')->nullable()->constrained('transactions')->onDelete('set null');

            $table->string('title');
            $table->text('description');
            $table->decimal('amount', 15, 2);
            $table->timestamp('deadline')->nullable();

            $table->enum('status', [
                'pending',          // Created, waiting for executor acceptance
                'accepted',         // Executor accepted, funds escrowed
                'in_progress',      // Work in progress
                'completed',        // Creator marked as completed
                'delivered',        // Executor delivered work
                'dispute',          // Dispute raised
                'cancelled',        // Cancelled by either party
                'refunded',         // Refunded to creator
                'released',          // Payment released to executor
            ])->default('pending');

            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('released_at')->nullable();

            $table->text('cancellation_reason')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->onDelete('set null');

            $table->text('dispute_reason')->nullable();
            $table->foreignId('dispute_raised_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('dispute_raised_at')->nullable();

            $table->text('admin_note')->nullable();

            $table->timestamps();

            $table->index(['conversation_id', 'status']);
            $table->index(['creator_id', 'status']);
            $table->index(['executor_id', 'status']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_transactions');
    }
};
