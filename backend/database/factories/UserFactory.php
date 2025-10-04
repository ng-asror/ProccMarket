<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'telegram_id' => $this->faker->optional()->numerify('########'),
            'email' => $this->faker->unique()->safeEmail(),
            'role_id' => $this->faker->optional()->numberBetween(1, 2), // mavjud role_id lar oralig'ida
            'balance' => $this->faker->randomFloat(2, 0, 10000),
            'name' => $this->faker->name(),
            'avatar' => $this->faker->optional()->imageUrl(200, 200, 'people'),
            'banned' => $this->faker->boolean(10), // 10% banlangan
            'last_deposit_at' => $this->faker->optional()->dateTimeBetween('-30 days', 'now'),
            'is_admin' => $this->faker->boolean(5), // 5% admin
            'email_verified_at' => $this->faker->optional()->dateTimeBetween('-1 year', 'now'),
            'password' => bcrypt('password'), // yoki $this->faker->password()
            'remember_token' => Str::random(10),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
