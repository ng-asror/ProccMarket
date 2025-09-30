<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'admin',
            'email' => 'admin@admin.com',
            'password' => bcrypt('admin123'), // Default password
            'is_admin' => true,
        ]);

        // Seed default settings
        DB::table('settings')->insert([
            ['key' => 'site_title', 'name' => 'Site Title', 'value' => 'My Forum'],
            ['key' => 'logo_img', 'name' => 'Logo URL', 'value' => null],
            ['key' => 'support_link', 'name' => 'Support Link', 'value' => 'https://support.example.com'],
            ['key' => 'bot_token', 'name' => 'Bot Token', 'value' => null],
            ['key' => 'crypto_bot_token', 'name' => 'CryptoBot Token', 'value' => null],
        ]);
    }
}
