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
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $limit = $request->get('limit', 10); // Default 10 ta news har bir category uchun

        $categories = Category::with(['news' => function ($query) use ($limit) {
            $query->where('status', 'published')
                ->latest()
                ->limit($limit)
                ->select(['id', 'title', 'image', 'user_id', 'category_id']);
        }])
        ->withCount(['news' => function ($query) {
            $query->where('status', 'published');
        }])
        ->get();

        // Har bir news uchun URL qo‘shish
        $categories->each(function ($category) {
            $category->news->each(function ($news) {
                $news->api_url = "/api/v1/news/{$news->id}";
            });
        });

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }


    /**
     * Get news by category with pagination
     * 
     * @param Request $request
     * @param int $categoryId
     * @return \Illuminate\Http\JsonResponse
     */
    public function byCategory(Request $request, $categoryId)
    {
        $perPage = $request->get('per_page', 10);

        $category = Category::find($categoryId);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found'
            ], 404);
        }

        $news = News::where('category_id', $categoryId)
            ->where('status', 'published')
            ->with(['category:id,name'])
            ->withCount(['comments', 'likes', 'views', 'shares'])
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'category' => $category,
            'data' => $news
        ]);
    }

    /**
     * Get single news details
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $news = News::with(['category:id,name', 'comments.user:id,name'])
            ->withCount(['comments', 'likes', 'views', 'shares'])
            ->where('status', 'published')
            ->find($id);

        if (!$news) {
            return response()->json([
                'success' => false,
                'message' => 'News not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $news
        ]);
    }

    /**
     * Get all categories list
     * 
     * @return \Illuminate\Http\JsonResponse
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
}