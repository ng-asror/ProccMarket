<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles for users
        Role::create(['id' => 1, 'name' => 'Basic', 'min_deposit' => 0]);
        Role::create(['id' => 2, 'name' => 'Premium', 'min_deposit' => 100]);
    }

    /**
     * Test user can update their own message within 24 hours.
     */
    public function test_user_can_update_own_message_within_24_hours(): void
    {
        $user = User::factory()->create(['role_id' => 1]);
        $otherUser = User::factory()->create(['role_id' => 1]);

        $conversation = Conversation::findOrCreateBetween($user->id, $otherUser->id);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'content' => 'Original message content',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->putJson("/api/v1/chat/messages/{$message->id}", [
                'content' => 'Updated message content',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Message updated successfully',
            ]);

        $this->assertDatabaseHas('messages', [
            'id' => $message->id,
            'content' => 'Updated message content',
        ]);
    }

    /**
     * Test user cannot update message after 24 hours.
     */
    public function test_user_cannot_update_message_after_24_hours(): void
    {
        $user = User::factory()->create(['role_id' => 1]);
        $otherUser = User::factory()->create(['role_id' => 1]);

        $conversation = Conversation::findOrCreateBetween($user->id, $otherUser->id);

        $message = new Message([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'content' => 'Original message content',
        ]);
        $message->created_at = now()->subHours(25);
        $message->updated_at = now()->subHours(25);
        $message->save();

        $response = $this->actingAs($user, 'sanctum')
            ->putJson("/api/v1/chat/messages/{$message->id}", [
                'content' => 'Updated message content',
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Messages can only be edited within 24 hours of creation',
            ]);

        $this->assertDatabaseHas('messages', [
            'id' => $message->id,
            'content' => 'Original message content',
        ]);
    }

    /**
     * Test user cannot update another user's message.
     */
    public function test_user_cannot_update_another_users_message(): void
    {
        $user = User::factory()->create(['role_id' => 1]);
        $otherUser = User::factory()->create(['role_id' => 1]);

        $conversation = Conversation::findOrCreateBetween($user->id, $otherUser->id);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $otherUser->id,
            'content' => 'Original message content',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->putJson("/api/v1/chat/messages/{$message->id}", [
                'content' => 'Updated message content',
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized to update this message',
            ]);

        $this->assertDatabaseHas('messages', [
            'id' => $message->id,
            'content' => 'Original message content',
        ]);
    }

    /**
     * Test admin can update any message within 24 hours.
     */
    public function test_admin_can_update_any_message_within_24_hours(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'role_id' => 1]);
        $user = User::factory()->create(['role_id' => 1]);
        $otherUser = User::factory()->create(['role_id' => 1]);

        $conversation = Conversation::findOrCreateBetween($user->id, $otherUser->id);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'content' => 'Original message content',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/chat/messages/{$message->id}", [
                'content' => 'Admin updated content',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Message updated successfully',
            ]);

        $this->assertDatabaseHas('messages', [
            'id' => $message->id,
            'content' => 'Admin updated content',
        ]);
    }

    /**
     * Test content is required when updating a message.
     */
    public function test_content_is_required_when_updating_message(): void
    {
        $user = User::factory()->create(['role_id' => 1]);
        $otherUser = User::factory()->create(['role_id' => 1]);

        $conversation = Conversation::findOrCreateBetween($user->id, $otherUser->id);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'content' => 'Original message content',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->putJson("/api/v1/chat/messages/{$message->id}", [
                'content' => '',
            ]);

        // 400 or 422 are both acceptable for validation errors
        $this->assertContains($response->status(), [400, 422]);

        if ($response->status() === 422) {
            $response->assertJsonValidationErrors(['content']);
        }
    }

    /**
     * Test unauthenticated user cannot update messages.
     */
    public function test_unauthenticated_user_cannot_update_messages(): void
    {
        $user = User::factory()->create(['role_id' => 1]);
        $otherUser = User::factory()->create(['role_id' => 1]);

        $conversation = Conversation::findOrCreateBetween($user->id, $otherUser->id);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'content' => 'Original message content',
        ]);

        $response = $this->withHeaders([
            'Accept' => 'application/json',
        ])->putJson("/api/v1/chat/messages/{$message->id}", [
            'content' => 'Updated message content',
        ]);

        // Unauthenticated requests should return 401 or 400
        $this->assertContains($response->status(), [400, 401]);
    }
}
