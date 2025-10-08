<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    /**
     * Existing user.
     */
    public function existUser(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => true,
                'exist' => true
            ], 200);
        }

        return response()->json([
            'success' => true,
            'exist' => false
        ]);
    }

    /**
     * Register a new user.
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email',
            'telegram_id' => 'nullable|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'email' => $request->email,
            'telegram_id' => $request->telegram_id,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Log in a user.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ], 200);
    }

    /**
     * Get authenticated user details.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'user' => $request->user()->load(['role']),
        ], 200);
    }

    public function myTopics(Request $request): JsonResponse
    {
        $user = $request->user();

        $topics = $user->topics()
            ->with([
                'section',
                'posts' => function ($q) {
                    $q->latest()->limit(1);
                },
                'likes',
                'shares'
            ])
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
            ->get()
            ->transform(function ($topic) use ($user) {
                $userLike = $topic->likes->firstWhere('user_id', $user->id);

                return [
                    'id' => $topic->id,
                    'title' => $topic->title,
                    'image' => $topic->image,
                    'image_url' => $topic->image_url,
                    'closed' => $topic->closed,
                    'created_at' => $topic->created_at,
                    'updated_at' => $topic->updated_at,
                    'section' => $topic->section ? [
                        'id' => $topic->section->id,
                        'name' => $topic->section->name,
                        'description' => $topic->section->description,
                        'image_url' => $topic->section->image_url,
                        'access_price' => $topic->section->access_price,
                        'position' => $topic->section->position,
                        'parent_id' => $topic->section->parent_id,
                    ] : null,
                    'posts_count' => $topic->posts_count,
                    'likes_count' => $topic->likes_count,
                    'dislikes_count' => $topic->dislikes_count,
                    'shares_count' => $topic->shares_count,
                    'views_count' => $topic->views_count,
                    'user_reaction' => $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null,
                    'user_shared' => $topic->shares->contains('user_id', $user->id),
                ];
            });

        return response()->json([
            'success' => true,
            'user' => $user->load(['role']),
            'topics' => $topics,
        ], 200);
    }



    /**
     * Update user profile.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8|confirmed',
            'description' => 'sometimes|nullable|string|max:1000',
            'avatar' => 'sometimes|nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->only(['name', 'email', 'description']);
        
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        // Handle avatar (URL or file upload)
        if ($request->filled('avatar')) {
            $avatar = $request->avatar;
            
            // Check if it's a URL
            if (filter_var($avatar, FILTER_VALIDATE_URL)) {
                $data['avatar'] = $avatar;
            } 
            // Check if it's a base64 image
            elseif (preg_match('/^data:image\/(\w+);base64,/', $avatar, $matches)) {
                $imageData = substr($avatar, strpos($avatar, ',') + 1);
                $imageData = base64_decode($imageData);
                $extension = $matches[1];
                
                $filename = 'avatars/' . uniqid() . '.' . $extension;
                Storage::disk('public')->put($filename, $imageData);
                
                $data['avatar'] = $filename;
            }
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => $user->load('role'),
        ], 200);
    }

    /**
     * Get user profile with analytics.
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user()->load('role');

        // Get topics count
        $topicsCount = $user->topics()->count();

        // Get total views on user's topics
        $viewsCount = $user->topics()
            ->withCount('views')
            ->get()
            ->sum('views_count');

        // Get total likes on user's topics (only is_like = true)
        $likesCount = $user->topics()
            ->withCount(['likes' => function ($query) {
                $query->where('is_like', true);
            }])
            ->get()
            ->sum('likes_count');

        return response()->json([
            'success' => true,
            'user' => $user,
            'analytics' => [
                'topics_count' => $topicsCount,
                'views_count' => $viewsCount,
                'likes_count' => $likesCount,
            ]
        ], 200);
    }

    /**
     * Log out a user.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ], 200);
    }


    public function googleLogin(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id_token' => 'required|string',
            'telegram_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Google'dan tokenni verify qilish
        $response = Http::get("https://oauth2.googleapis.com/tokeninfo", [
            'id_token' => $request->id_token
        ]);

        if ($response->failed()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid Google token'
            ], 401);
        }

        $googleUser = $response->json();

        // Google qaytargan foydalanuvchi ma'lumotlari
        $email = $googleUser['email'] ?? null;
        $name = $googleUser['name'] ?? null;
        $avatar = $googleUser['picture'] ?? null;

        if (!$email) {
            return response()->json([
                'success' => false,
                'message' => 'Google account does not have a valid email'
            ], 400);
        }

        // User mavjudligini tekshirish yoki yaratish
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make(uniqid()), // random password
                'avatar' => $avatar ?? null,
            ]
        )->fresh();

        // Token yaratish
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => $user->load('role'),
            'token' => $token,
        ], 200);
    }
}