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
        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('image'); // Path to the banner image
            $table->string('link')->nullable(); // URL to redirect when clicked
            $table->boolean('is_active')->default(true);
            $table->integer('order')->default(0); // For sorting banners
            $table->timestamp('starts_at')->nullable(); // When banner should start showing
            $table->timestamp('ends_at')->nullable(); // When banner should stop showing
            $table->timestamps();
            $table->softDeletes(); // Soft delete for banner history
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banners');
    }
};