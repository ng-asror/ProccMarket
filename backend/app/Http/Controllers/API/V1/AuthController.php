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
     * Check if user exists.
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
            'referral_code' => 'nullable|string|exists:users,referral_code',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Find referrer if referral code provided
        $referrerId = null;
        if ($request->filled('referral_code')) {
            $referrer = User::where('referral_code', $request->referral_code)->first();
            
            if ($referrer) {
                $referrerId = $referrer->id;
            }
        }

        $user = User::create([
            'email' => $request->email,
            'telegram_id' => $request->telegram_id,
            'password' => Hash::make($request->password),
            'referred_by' => $referrerId,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'user' => $user->load('role'),
            'token' => $token,
            'referred_by' => $referrerId ? $user->referrer->only(['id', 'name', 'email']) : null,
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
            'user' => $user->load('role'),
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

    /**
     * Get user topics.
     */
    public function myTopics(Request $request): JsonResponse
    {
        $user = $request->user();

        $topics = $user->topics()
            ->with([
                'section', 'section.parent',
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
                        'parent' => $topic->section->parent ? [
                            'id' => $topic->section->parent->id,
                            'name' => $topic->section->parent->name,
                            'description' => $topic->section->parent->description,
                            'image_url' => $topic->section->parent->image_url,
                            'access_price' => $topic->section->parent->access_price,
                            'position' => $topic->section->parent->position,
                            'parent_id' => $topic->section->parent->parent_id,
                        ] : null,
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
            'cover' => 'sometimes|nullable|string',
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

        if ($request->filled('avatar')) {
            $avatar = $request->avatar;
            
            if (filter_var($avatar, FILTER_VALIDATE_URL)) {
                $data['avatar'] = $avatar;
            } 
            elseif (preg_match('/^data:image\/(\w+);base64,/', $avatar, $matches)) {
                // Delete old avatar if it exists and is not a URL
                if ($user->avatar && !filter_var($user->avatar, FILTER_VALIDATE_URL)) {
                    Storage::disk('public')->delete($user->avatar);
                }

                $imageData = substr($avatar, strpos($avatar, ',') + 1);
                $imageData = base64_decode($imageData);
                $extension = $matches[1];
                
                $filename = 'avatars/' . uniqid() . '.' . $extension;
                Storage::disk('public')->put($filename, $imageData);
                
                $data['avatar'] = $filename;
            }
        }

        if ($request->filled('cover')) {
            $cover = $request->cover;
            
            if (filter_var($cover, FILTER_VALIDATE_URL)) {
                $data['cover'] = $cover;
            } 
            elseif (preg_match('/^data:image\/(\w+);base64,/', $cover, $matches)) {
                // Delete old cover if it exists and is not a URL
                if ($user->cover && !filter_var($user->cover, FILTER_VALIDATE_URL)) {
                    Storage::disk('public')->delete($user->cover);
                }

                $imageData = substr($cover, strpos($cover, ',') + 1);
                $imageData = base64_decode($imageData);
                $extension = $matches[1];
                
                $filename = 'covers/' . uniqid() . '.' . $extension;
                Storage::disk('public')->put($filename, $imageData);
                
                $data['cover'] = $filename;
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
     * Get user profile with analytics and referral data.
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

        // Get referral statistics
        $referralStats = $user->getReferralStats();

        // If $user->referral_code is null, generate one
        if (!$user->referral_code) {
            $user->referral_code = $user->generateUniqueReferralCode();
            $user->save();
        }

        return response()->json([
            'success' => true,
            'user' => $user,
            'analytics' => [
                'topics_count' => $topicsCount,
                'views_count' => $viewsCount,
                'likes_count' => $likesCount,
            ],
            'referral' => [
                'code' => $user->referral_code,
                'stats' => $referralStats,
                'referred_by' => $user->hasReferrer() 
                    ? $user->referrer->only(['id', 'name', 'email', 'avatar_url'])
                    : null,
            ]
        ], 200);
    }

    /**
     * Get detailed referral list.
     */
    public function referralList(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $perPage = $request->input('per_page', 15);
        $status = $request->input('status'); // 'active', 'banned', or null for all

        $query = $user->referrals()
            ->select(['id', 'name', 'email', 'avatar', 'created_at', 'banned'])
            ->latest();

        if ($status === 'active') {
            $query->where('banned', false);
        } elseif ($status === 'banned') {
            $query->where('banned', true);
        }

        $referrals = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'referrals' => $referrals->through(function ($referral) {
                return [
                    'id' => $referral->id,
                    'name' => $referral->name,
                    'email' => $referral->email,
                    'avatar_url' => $referral->avatar_url,
                    'joined_at' => $referral->created_at,
                    'status' => $referral->banned ? 'banned' : 'active',
                ];
            }),
            'stats' => $user->getReferralStats(),
        ], 200);
    }

    /**
     * Validate referral code.
     */
    public function validateReferralCode(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'referral_code' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $referrer = User::where('referral_code', $request->referral_code)
            ->where('banned', false)
            ->first();

        if (!$referrer) {
            return response()->json([
                'success' => false,
                'valid' => false,
                'message' => 'Invalid or inactive referral code'
            ], 200);
        }

        return response()->json([
            'success' => true,
            'valid' => true,
            'referrer' => [
                'name' => $referrer->name,
                'email' => $referrer->email,
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

    /**
     * Google login with referral support.
     */
    public function googleLogin(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id_token' => 'required|string',
            'telegram_id' => 'required|string',
            'referral_code' => 'nullable|string|exists:users,referral_code',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

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

        $email = $googleUser['email'] ?? null;
        $name = $googleUser['name'] ?? null;
        $avatar = $googleUser['picture'] ?? null;

        if (!$email) {
            return response()->json([
                'success' => false,
                'message' => 'Google account does not have a valid email'
            ], 400);
        }

        // Find referrer if referral code provided
        $referrerId = null;
        if ($request->filled('referral_code')) {
            $referrer = User::where('referral_code', $request->referral_code)->first();
            
            if ($referrer) {
                $referrerId = $referrer->id;
            }
        }

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make(uniqid()),
                'avatar' => $avatar ?? null,
                'referred_by' => $referrerId,
            ]
        )->fresh();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => $user->load('role'),
            'token' => $token,
        ], 200);
    }
}