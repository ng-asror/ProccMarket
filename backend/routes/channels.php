<?php

use App\Models\Section;
use App\Models\Topic;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

// Section channel - faqat section ga kirish huqqi bor userlar
Broadcast::channel('section.{sectionId}', function ($user, $sectionId) {
    $section = Section::find($sectionId);

    if (! $section) {
        return false;
    }

    // Admin barcha section ga kirishi mumkin
    if ($user->is_admin) {
        return ['id' => $user->id, 'name' => $user->name];
    }

    // Sotib olingan section
    if ($user->sections()->where('section_id', $sectionId)->exists()) {
        return ['id' => $user->id, 'name' => $user->name];
    }

    // Bepul section
    if ($section->access_price == 0) {
        return ['id' => $user->id, 'name' => $user->name];
    }

    // Default role orqali kirish
    if ($user->role_id && $section->default_roles &&
        in_array($user->role_id, $section->default_roles)) {
        return ['id' => $user->id, 'name' => $user->name];
    }

    return false;
});

// Topic channel - faqat topic section ga kirish huqqi bor userlar
Broadcast::channel('topic.{topicId}', function ($user, $topicId) {
    $topic = Topic::with('section')->find($topicId);

    if (! $topic) {
        return false;
    }

    $section = $topic->section;

    // Admin barcha topic ga kirishi mumkin
    if ($user->is_admin) {
        return ['id' => $user->id, 'name' => $user->name];
    }

    // Sotib olingan section
    if ($user->sections()->where('section_id', $section->id)->exists()) {
        return ['id' => $user->id, 'name' => $user->name];
    }

    // Bepul section
    if ($section->access_price == 0) {
        return ['id' => $user->id, 'name' => $user->name];
    }

    // Default role orqali kirish
    if ($user->role_id && $section->default_roles &&
        in_array($user->role_id, $section->default_roles)) {
        return ['id' => $user->id, 'name' => $user->name];
    }

    return false;
});

// User-specific channel - for notifications and private messages
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Conversation channel - only participants and admins can access
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $conversation = \App\Models\Conversation::find($conversationId);

    if (! $conversation) {
        return false;
    }

    // Admin can access all conversations
    if ($user->is_admin) {
        return ['id' => $user->id, 'name' => $user->name];
    }

    // Check if user is a participant
    if ($conversation->hasParticipant($user->id)) {
        return ['id' => $user->id, 'name' => $user->name];
    }

    return false;
});