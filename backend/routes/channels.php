<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Section;
use App\Models\Topic;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

// Section channel - faqat section ga kirish huqqi bor userlar
Broadcast::channel('section.{sectionId}', function ($user, $sectionId) {
    $section = Section::find($sectionId);
    
    if (!$section) {
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
    
    if (!$topic) {
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

// User-specific channel
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});