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

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 10);
        
        // Barcha root sectionlarni olish
        $sections = Section::with(['parent',
                'topics' => function ($query) use ($user, $page, $perPage) {
                    $query->with(['user'])
                        ->withCount([
                            'posts',
                            'likes as likes_count' => function ($q) {
                                $q->where('is_like', true);
                            },
                            'likes as dislikes_count' => function ($q) {
                                $q->where('is_like', false);
                            },
                            'shares',
                            'views'
                        ])
                        ->latest('updated_at')
                        ->skip(($page - 1) * $perPage)
                        ->take($perPage);
                }
            ])
            ->withCount('topics')
            ->get();

        // Har bir section uchun ma'lumotlarni formatlash
        $dashboardData = $sections->map(function ($section) use ($user) {
            $hasAccess = $this->userHasAccess($user, $section);
            
            // Topic'larni formatlash
            $topics = $section->topics->map(function ($topic) use ($user) {
                $userLike = $topic->likes->firstWhere('user_id', $user->id);
                
                return [
                    'id' => $topic->id,
                    'title' => $topic->title,
                    'image' => $topic->image,
                    'image_url' => $topic->image_url,
                    'closed' => $topic->closed,
                    'created_at' => $topic->created_at,
                    'updated_at' => $topic->updated_at,
                    'author' => $topic->user,
                    'posts_count' => $topic->posts_count,
                    'likes_count' => $topic->likes_count,
                    'dislikes_count' => $topic->dislikes_count,
                    'shares_count' => $topic->shares_count,
                    'views_count' => $topic->views_count,
                    'user_reaction' => $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null,
                    'user_shared' => $topic->shares()->where('user_id', $user->id)->exists(),
                ];
            });

            return [
                'id' => $section->id,
                'name' => $section->name,
                'description' => $section->description,
                'image_url' => $section->image_url,
                'access_price' => $section->access_price,
                'topics_count' => $section->topics_count,
                'has_access' => $hasAccess,
                'is_purchased' => $user->sections()->where('section_id', $section->id)->exists(),
                'default_roles_json' => $section->default_roles_json,
                'parent_id' => $section->parent_id,
                'parent' => $section->parent,
                'position' => $section->position,
                'topics' => $topics,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Dashboard data retrieved successfully',
            'sections' => $dashboardData,
            'total_sections' => $sections->count(),
        ], 200);
    }
    
    /**
     * Barcha sectionlarni ko'rsatish (foydalanuvchi kirishi mumkin yoki mumkin emasligi bilan)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $allSections = Section::withCount('topics')
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
                    'default_roles_json' => $section->default_roles_json,
                    'parent_id' => $section->parent_id,
                    'position' => $section->position
                ];
            });

        $transformedSections = Section::withCount('topics')
            ->with('topics.posts')
            ->get()
            ->transform(function ($section) use ($user) {
                $section->has_access = $this->userHasAccess($user, $section);
                $section->is_purchased = $user->sections()->where('section_id', $section->id)->exists();
                $section->posts_count = $section->topics->sum('posts_count');

                unset($section->topics);
                
                return $section;
            });

        $sections = Section::buildTree($transformedSections);

        return response()->json([
            'success' => true,
            'message' => 'Sections retrieved successfully',
            'sections' => $sections,
            'allSections' => $allSections
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

        $transformedSections = Section::where('parent_id', $section->id)
            ->withCount('topics')
            ->with('topics.posts')
            ->get()
            ->transform(function ($section) use ($user) {
                $section->has_access = $this->userHasAccess($user, $section);
                $section->is_purchased = $user->sections()->where('section_id', $section->id)->exists();
                $section->posts_count = $section->topics->sum('posts_count');

                unset($section->topics);
                
                return $section;
            });

        $child = Section::buildTree($transformedSections, $section->id);
        
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
                'parent_id' => $section->parent_id,
                'position' => $section->position,
                'children' => $child
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