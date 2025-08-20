<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('access_price', 10, 0)->default(0);
            $table->json('default_roles')->nullable(); // Array of role_ids for free access
            $table->string('image')->nullable(); // Add image column
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('sections');
    }
};