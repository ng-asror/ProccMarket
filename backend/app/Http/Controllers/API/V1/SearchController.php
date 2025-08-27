<?php

namespace App\Http\Controllers\API\V1;

use App\Models\Post;
use App\Models\Section;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;

class SearchController extends Controller
{
    /**
     * Forum ichida qidiruv
     */
    public function search(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:3|max:255',
            'section_id' => 'nullable|exists:sections,id',
            'topic_id' => 'nullable|exists:topics,id',
            'type' => 'nullable|in:topics,posts,all',
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $query = $request->input('query');
        $sectionId = $request->input('section_id');
        $topicId = $request->input('topic_id');
        $type = $request->input('type', 'all');
        $perPage = $request->input('per_page', 20);

        // Foydalanuvchi kirish huquqi bor bo'lgan sectionlarni olish
        $accessibleSections = $this->getAccessibleSections($user);

        if ($accessibleSections->isEmpty()) {
            return response()->json([
                'success' => true,
                'message' => 'No accessible sections found',
                'topics' => [],
                'posts' => [],
                'pagination' => []
            ], 200);
        }

        $results = [
            'topics' => [],
            'posts' => []
        ];

        // Section filter
        $sectionsToSearch = $accessibleSections;
        if ($sectionId) {
            $section = Section::find($sectionId);
            if (!$section || !$accessibleSections->contains('id', $sectionId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have access to this section'
                ], 403);
            }
            $sectionsToSearch = collect([$section]);
        }

        // Topic filter
        $topicsToSearch = null;
        if ($topicId) {
            $topic = Topic::find($topicId);
            if (!$topic || !$accessibleSections->contains('id', $topic->section_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have access to this topic'
                ], 403);
            }
            $topicsToSearch = collect([$topic]);
        }

        // Topics qidirish
        if (in_array($type, ['topics', 'all']) && !$topicId) {
            $topicsQuery = Topic::whereIn('section_id', $sectionsToSearch->pluck('id'))
                ->where('title', 'LIKE', "%{$query}%")
                ->orWhere('content', 'LIKE', "%{$query}%")
                ->with(['user', 'section:id,name,image'])
                ->withCount(['posts', 'likes', 'shares']);

            if ($sectionId) {
                $topicsQuery->where('section_id', $sectionId);
            }

            $topics = $topicsQuery->paginate($perPage, ['*'], 'topics_page');

            $topics->getCollection()->transform(function ($topic) use ($user) {
                $userLike = $topic->likes->firstWhere('user_id', $user->id);

                return [
                    'id' => $topic->id,
                    'title' => $topic->title,
                    'content' => $topic->content,
                    'image' => $topic->image,
                    'closed' => $topic->closed,
                    'created_at' => $topic->created_at,
                    'updated_at' => $topic->updated_at,
                    'author' => $topic->user,
                    'section' => $topic->section,
                    'posts_count' => $topic->posts_count,
                    'likes_count' => $topic->likes_count,
                    'shares_count' => $topic->shares_count,
                    'user_reaction' => $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null,
                ];
            });


            $results['topics'] = $topics->items();
            $results['topics_pagination'] = [
                'current_page' => $topics->currentPage(),
                'per_page' => $topics->perPage(),
                'total' => $topics->total(),
                'last_page' => $topics->lastPage(),
            ];
        }

        // Posts qidirish
        if (in_array($type, ['posts', 'all'])) {
            $postsQuery = Post::whereHas('topic', function ($query) use ($sectionsToSearch) {
                $query->whereIn('section_id', $sectionsToSearch->pluck('id'));
            })
            ->where('content', 'LIKE', "%{$query}%")
            ->with(['user', 'topic:id,title,content,section_id,image', 'topic.section:id,name,description,image'])
            ->withCount(['likes as likes_count' => function ($query) {
                $query->where('is_like', true);
            }])
            ->withCount(['likes as dislikes_count' => function ($query) {
                $query->where('is_like', false);
            }]);

            if ($sectionId) {
                $postsQuery->whereHas('topic', function ($query) use ($sectionId) {
                    $query->where('section_id', $sectionId);
                });
            }

            if ($topicId) {
                $postsQuery->where('topic_id', $topicId);
            }


            $posts = $postsQuery->paginate($perPage, ['*'], 'posts_page');

            $posts->getCollection()->transform(function ($post) use ($user) {
                $userLike = $post->likes()->where('user_id', $user->id)->first();

                return [
                    'id' => $post->id,
                    'content' => $post->content,
                    'image' => $post->image,
                    'created_at' => $post->created_at,
                    'updated_at' => $post->updated_at,
                    'author' => $post->user,
                    'topic' => $post->topic,
                    'likes_count' => $post->likes_count,
                    'dislikes_count' => $post->dislikes_count,
                    'user_reaction' => $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null,
                    'reply_to' => $post->reply_id,
                ];
            });

            // // Message ID qo'shish
            // $posts->getCollection()->transform(function ($post) {
            //     $messageId = Post::where('topic_id', $post->topic_id)
            //         ->where('id', '<=', $post->id)
            //         ->count();
                
            //     $post->message_id = $messageId;
            //     return $post;
            // });

            $results['posts'] = $posts->items();
            $results['posts_pagination'] = [
                'current_page' => $posts->currentPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
                'last_page' => $posts->lastPage(),
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'Search completed successfully',
            'query' => $query,
            'filters' => [
                'section_id' => $sectionId,
                'topic_id' => $topicId,
                'type' => $type
            ],
            'results' => $results
        ], 200);
    }

    /**
     * Foydalanuvchi kirish huquqi bor bo'lgan sectionlarni olish
     */
    private function getAccessibleSections($user)
    {
        // Admin barcha section ga kira oladi
        if ($user->is_admin) {
            return Section::all();
        }

        $sections = Section::where(function ($query) use ($user) {
            // Bepul sectionlar
            $query->where('access_price', 0)
                // Yoki sotib olingan sectionlar
                ->orWhereHas('users', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });

            // Yoki default_roles ichida foydalanuvchi roli bor
            if ($user->role_id) {
                $query->orWhereJsonContains('default_roles', $user->role_id);
            }
        })->get();

        return $sections;
    }
}