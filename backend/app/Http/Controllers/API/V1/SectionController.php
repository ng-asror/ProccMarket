<?php

namespace App\Http\Controllers\API\V1;

use App\Models\Section;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class SectionController extends Controller
{
    /**
     * Barcha sectionlarni ko'rsatish (foydalanuvchi kirishi mumkin yoki mumkin emasligi bilan)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $sections = Section::withCount('topics')
            ->with('topics.posts')
            ->get()
            ->map(function ($section) use ($user) {
                // Foydalanuvchi kira oladimi tekshirish
                $hasAccess = $this->userHasAccess($user, $section);
                
                return [
                    'id' => $section->id,
                    'name' => $section->name,
                    'description' => $section->description,
                    'image_url' => $section->image_url,
                    'access_price' => $section->access_price,
                    'topics_count' => $section->topics_count,
                    'posts_count' => $section->topics->sum('posts_count'),
                    'has_access' => $hasAccess,
                    'is_purchased' => $user->sections()->where('section_id', $section->id)->exists(),
                    'default_roles' => $section->default_roles
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Sections retrieved successfully',
            'sections' => $sections
        ], 200);
    }

    /**
     * Section ma'lumotlarini ko'rsatish
     */
    public function show(Request $request, Section $section): JsonResponse
    {
        $user = $request->user();
        
        // if (!$this->userHasAccess($user, $section)) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'You do not have access to this section',
        //         'access_required' => true,
        //         'access_price' => $section->access_price
        //     ], 403);
        // }

        $section->load(['topics.user', 'topics.posts']);
        $hasAccess = $this->userHasAccess($user, $section);
        
        return response()->json([
            'success' => true,
            'message' => 'Section details retrieved successfully',
            'section' => [
                'id' => $section->id,
                'name' => $section->name,
                'description' => $section->description,
                'image_url' => $section->image_url,
                'topics_count' => $section->topics->count(),
                'posts_count' => $section->topics->sum(function ($topic) {
                    return $topic->posts->count();
                }),
                'access_price' => $section->access_price,
                'has_access' => $hasAccess,
                'is_purchased' => $user->sections()->where('section_id', $section->id)->exists(),
            ]
        ], 200);
    }

    /**
     * Section sotib olish
     */
    public function purchase(Request $request, Section $section): JsonResponse
    {
        $user = $request->user();
        
        // Agar foydalanuvchi allaqachon sotib olgan bo'lsa
        if ($user->sections()->where('section_id', $section->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'You have already purchased this section'
            ], 400);
        }

        // Agar foydalanuvchi rolga ega bo'lsa, bepul kirish
        if ($this->userHasAccess($user, $section)) {
            $user->sections()->attach($section->id);
            
            return response()->json([
                'success' => true,
                'message' => 'Section access granted for free based on your role'
            ], 200);
        }

        // Balance tekshirish
        if ($user->balance < $section->access_price) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient balance',
                'required_amount' => $section->access_price,
                'current_balance' => $user->balance
            ], 400);
        }

        DB::transaction(function () use ($user, $section) {
            // Balance dan narxni ayirish
            $user->decrement('balance', $section->access_price);
            
            // Section ga kirish huquqini berish
            $user->sections()->attach($section->id);
        });

        return response()->json([
            'success' => true,
            'message' => 'Section purchased successfully',
            'new_balance' => $user->fresh()->balance
        ], 200);
    }

    /**
     * Foydalanuvchi section ga kira oladimi tekshirish
     */
    private function userHasAccess(User $user, Section $section): bool
    {
        // Agar admin bo'lsa
        if ($user->is_admin) {
            return true;
        }

        // Agar allaqachon sotib olgan bo'lsa
        if ($user->sections()->where('section_id', $section->id)->exists()) {
            return true;
        }

        // Agar section bepul bo'lsa
        if ($section->access_price == 0) {
            return true;
        }

        // Agar foydalanuvchi roli default_roles ichida bo'lsa
        if ($user->role_id && $section->default_roles && 
            in_array($user->role_id, $section->default_roles)) {
            return true;
        }

        return false;
    }
}