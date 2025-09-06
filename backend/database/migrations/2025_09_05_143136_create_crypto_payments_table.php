<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCryptoPaymentsTable extends Migration
{
    public function up()
    {
        Schema::create('crypto_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            $table->unsignedBigInteger('invoice_id')->unique();
            $table->string('hash')->unique();
            $table->string('currency_type')->default('crypto');
            $table->string('asset');
            $table->decimal('amount', 20, 8);

            $table->string('paid_asset')->nullable();
            $table->decimal('paid_amount', 20, 8)->nullable();
            $table->decimal('fee_amount', 20, 8)->nullable();
            $table->decimal('fee_in_usd', 20, 8)->nullable();
            $table->decimal('usd_rate', 20, 8)->nullable();
            $table->decimal('paid_usd_rate', 20, 8)->nullable();

            $table->string('pay_url');
            $table->string('bot_invoice_url');
            $table->string('mini_app_invoice_url')->nullable();
            $table->string('web_app_invoice_url')->nullable();

            $table->string('description')->nullable();
            $table->enum('status', ['active', 'paid', 'expired'])->default('active');

            $table->boolean('allow_comments')->default(false);
            $table->boolean('allow_anonymous')->default(false);
            $table->boolean('paid_anonymously')->nullable();

            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('crypto_payments');
    }
}
