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
        Schema::create('partnership_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Application fields
            $table->text('processing_experience'); // Processing va kriptovalyuta bilan ishlash tajribasi
            $table->decimal('deposit_amount', 15, 2); // Depozit hajmi
            $table->text('about_yourself'); // O'zingiz va tajribangiz haqida
            
            // Status tracking
            $table->enum('status', ['pending', 'under_review', 'approved', 'rejected'])->default('pending');
            $table->text('admin_notes')->nullable(); // Admin uchun izohlar
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();
            $table->softDeletes(); // Soft delete - admin delete qilganda
            
            // User bir vaqtning o'zida faqat bitta aktiv ariza yuborishi mumkin
            $table->unique(['user_id', 'deleted_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partnership_applications');
    }
};