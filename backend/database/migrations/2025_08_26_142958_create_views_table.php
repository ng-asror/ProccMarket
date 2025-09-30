<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('views', function (Blueprint $table) {
            $table->id();

            // Polymorphic relationship
            $table->morphs('viewable'); // viewable_id + viewable_type

            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            // Bir user bir viewable uchun kuniga bir marta view count qilish uchun
            $table->unique(['viewable_id', 'viewable_type', 'user_id', 'ip_address']);
            $table->index(['viewable_id', 'viewable_type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('views');
    }
};