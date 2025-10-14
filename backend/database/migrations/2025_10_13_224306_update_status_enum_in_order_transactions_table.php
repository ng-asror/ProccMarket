<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class UpdateStatusEnumInOrderTransactionsTable extends Migration
{
    public function up()
    {
        // ENUM qiymatlarini yangilash
        DB::statement("ALTER TABLE `order_transactions` MODIFY `status` ENUM(
            'pending',
            'accepted',
            'in_progress',
            'completed',
            'delivered',
            'dispute',
            'cancelled',
            'refunded',
            'released',
            'cancellation_requested'
        ) NOT NULL");
    }

    public function down()
    {
        // rollback uchun eski ENUM qiymatlari
        DB::statement("ALTER TABLE `order_transactions` MODIFY `status` ENUM(
            'pending',
            'accepted',
            'in_progress',
            'completed',
            'delivered',
            'dispute',
            'cancelled',
            'refunded',
            'released'
        ) NOT NULL");
    }
}
