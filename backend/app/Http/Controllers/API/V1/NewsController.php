<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\News;
use Illuminate\Http\Request;

class NewsController extends Controller
{
    /**
     * Get all categories with limited news
     */
    public function index(Request $request)
    {
        $limit = $request->get('limit', 10);
        $user = $request->user();

        $categories = Category::with(['news' => function ($query) use ($limit) {
            $query->where('status', 'published')
                ->latest()
                ->withCount([
                    'comments',
                    'likes as likes_count' => function ($query) {
                        $query->where('is_like', true);
                    },
                    'likes as dislikes_count' => function ($query) {
                        $query->where('is_like', false);
                    },
                    'views',
                    'shares'
                ])
                ->select(['id', 'title', 'image', 'user_id', 'category_id', 'created_at']);
        }])
        ->withCount(['news' => function ($query) {
            $query->where('status', 'published');
        }])
        ->get();

        // Add user reaction for each news
        $categories->each(function ($category) use ($user) {
            $category->news->each(function ($news) use ($user) {
                $news->api_url = "/api/v1/news/{$news->id}";
                
                if ($user) {
                    $userLike = $news->likes()->where('user_id', $user->id)->first();
                    $news->user_reaction = $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null;
                    $news->user_shared = $news->shares()->where('user_id', $user->id)->exists();
                } else {
                    $news->user_reaction = null;
                    $news->user_shared = false;
                }
            });
        });

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Get news by category with pagination
     */
    public function byCategory(Request $request, $categoryId)
    {
        $perPage = $request->get('per_page', 10);
        $user = $request->user();

        $category = Category::find($categoryId);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found'
            ], 404);
        }

        $news = News::where('category_id', $categoryId)
            ->where('status', 'published')
            ->with(['category:id,name', 'user'])
            ->withCount([
                'comments',
                'likes as likes_count' => function ($query) {
                    $query->where('is_like', true);
                },
                'likes as dislikes_count' => function ($query) {
                    $query->where('is_like', false);
                },
                'views',
                'shares'
            ])
            ->latest()
            ->paginate($perPage);

        // Add user reactions
        if ($user) {
            $news->getCollection()->transform(function ($item) use ($user) {
                $userLike = $item->likes()->where('user_id', $user->id)->first();
                $item->user_reaction = $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null;
                $item->user_shared = $item->shares()->where('user_id', $user->id)->exists();
                return $item;
            });
        }

        return response()->json([
            'success' => true,
            'category' => $category,
            'data' => $news
        ]);
    }

    /**
     * Get single news details with view tracking
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        
        $news = News::with([
            'category:id,name', 
            'user',
            'comments' => function ($query) {
                $query->whereNull('replay_id')
                    ->with(['user'])
                    ->withCount([
                        'likes as likes_count' => function ($query) {
                            $query->where('is_like', true);
                        },
                        'likes as dislikes_count' => function ($query) {
                            $query->where('is_like', false);
                        },
                        'replies'
                    ])
                    ->latest()
                    ->limit(5);
            }
        ])
        ->withCount([
            'comments',
            'likes as likes_count' => function ($query) {
                $query->where('is_like', true);
            },
            'likes as dislikes_count' => function ($query) {
                $query->where('is_like', false);
            },
            'views',
            'shares'
        ])
        ->where('status', 'published')
        ->find($id);

        if (!$news) {
            return response()->json([
                'success' => false,
                'message' => 'News not found'
            ], 404);
        }

        // Track view
        $this->trackView($request, $news);

        // Add user reactions
        $userReaction = null;
        $userShared = false;

        if ($user) {
            $userLike = $news->likes()->where('user_id', $user->id)->first();
            $userReaction = $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null;
            $userShared = $news->shares()->where('user_id', $user->id)->exists();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $news->id,
                'title' => $news->title,
                'description' => $news->description,
                'image' => $news->image,
                'image_url' => $news->image_url,
                'status' => $news->status,
                'created_at' => $news->created_at,
                'updated_at' => $news->updated_at,
                'category' => $news->category,
                'author' => $news->user,
                'likes_count' => $news->likes_count,
                'dislikes_count' => $news->dislikes_count,
                'views_count' => $news->views_count,
                'shares_count' => $news->shares_count,
                'comments_count' => $news->comments_count,
                'user_reaction' => $userReaction,
                'user_shared' => $userShared,
                'recent_comments' => $news->comments,
            ]
        ]);
    }

    /**
     * Get all categories list
     */
    public function categories()
    {
        $categories = Category::withCount(['news' => function ($query) {
            $query->where('status', 'published');
        }])->get();

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Track view for news
     */
    private function trackView(Request $request, News $news)
    {
        $user = $request->user();
        $ipAddress = $request->ip();
        $userAgent = $request->userAgent();

        // Check if already viewed (within last 24 hours)
        $existingView = $news->views()
            ->where(function ($query) use ($user, $ipAddress) {
                if ($user) {
                    $query->where('user_id', $user->id);
                } else {
                    $query->where('ip_address', $ipAddress);
                }
            })
            ->where('created_at', '>=', now()->subDay())
            ->first();

        if (!$existingView) {
            $news->views()->create([
                'user_id' => $user ? $user->id : null,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
            ]);
        }
    }
}