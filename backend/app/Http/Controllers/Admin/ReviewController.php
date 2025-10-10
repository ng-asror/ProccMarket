<?php

namespace App\Http\Controllers\Admin;

use App\Models\Review;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    /**
     * Display all reviews (Admin Panel)
     */
    public function index(Request $request): Response
    {
        // Build the query for all reviews
        $query = Review::with('user')
            ->orderBy('created_at', 'desc');

        // Apply search filter (user name, email, or comment)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('comment', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Apply star rating filter
        if ($request->filled('star') && $request->star !== 'all') {
            $query->where('star', $request->star);
        }

        // Apply date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Paginate results
        $reviews = $query->paginate(20);

        // Calculate statistics
        $stats = $this->calculateReviewStats();

        return Inertia::render('admin/reviews/index', [
            'reviews' => $reviews,
            'stats' => $stats,
            'filters' => $request->only(['search', 'star', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Display reviews for a specific user
     */
    public function userReviews(Request $request, User $user): Response
    {
        // Build the query for user's reviews
        $query = Review::where('user_id', $user->id)
            ->orderBy('created_at', 'desc');

        // Apply search filter (comment only)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('comment', 'like', "%{$search}%");
        }

        // Apply star rating filter
        if ($request->filled('star') && $request->star !== 'all') {
            $query->where('star', $request->star);
        }

        // Apply date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Paginate results
        $reviews = $query->paginate(20);

        // Calculate user-specific statistics
        $userStats = $this->calculateUserReviewStats($user->id);

        return Inertia::render('admin/reviews/user-reviews', [
            'reviews' => $reviews,
            'stats' => $userStats,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
            ],
            'filters' => $request->only(['search', 'star', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Show single review details
     */
    public function show(Review $review): Response
    {
        $review->load('user');

        return Inertia::render('admin/reviews/show', [
            'review' => $review
        ]);
    }

    /**
     * Delete a review (Admin only)
     */
    public function destroy(Review $review)
    {
        $review->delete();

        return redirect()->route('admin.reviews.index')->with('success', 'Review deleted successfully');
    }

    /**
     * Calculate overall review statistics
     */
    private function calculateReviewStats(): array
    {
        $totalReviews = Review::count();
        $averageRating = Review::avg('star');
        
        // Count by rating
        $ratingDistribution = [];
        for ($i = 1; $i <= 5; $i++) {
            $ratingDistribution[$i] = Review::where('star', $i)->count();
        }

        // Today's reviews
        $todayReviews = Review::whereDate('created_at', today())->count();

        // This month's reviews
        $thisMonthReviews = Review::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return [
            'totalReviews' => $totalReviews,
            'averageRating' => round($averageRating, 2),
            'ratingDistribution' => $ratingDistribution,
            'todayReviews' => $todayReviews,
            'thisMonthReviews' => $thisMonthReviews,
            'totalUsers' => Review::distinct('user_id')->count(),
        ];
    }

    /**
     * Calculate review statistics for a specific user
     */
    private function calculateUserReviewStats(int $userId): array
    {
        $totalReviews = Review::where('user_id', $userId)->count();
        $averageRating = Review::where('user_id', $userId)->avg('star');
        
        // Count by rating for this user
        $ratingDistribution = [];
        for ($i = 1; $i <= 5; $i++) {
            $ratingDistribution[$i] = Review::where('user_id', $userId)
                ->where('star', $i)
                ->count();
        }

        // Latest review date
        $latestReview = Review::where('user_id', $userId)
            ->latest('created_at')
            ->first();

        return [
            'totalReviews' => $totalReviews,
            'averageRating' => round($averageRating, 2),
            'ratingDistribution' => $ratingDistribution,
            'latestReviewDate' => $latestReview ? $latestReview->created_at : null,
        ];
    }

    /**
     * Export reviews to CSV (Admin only)
     */
    public function export(Request $request)
    {
        $query = Review::with('user')->orderBy('created_at', 'desc');

        // Apply same filters as index
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('comment', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('star') && $request->star !== 'all') {
            $query->where('star', $request->star);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $reviews = $query->get();

        $csvData = [];
        $csvData[] = ['ID', 'User', 'Email', 'Rating', 'Comment', 'Created At'];

        foreach ($reviews as $review) {
            $csvData[] = [
                $review->id,
                $review->user->name ?? 'N/A',
                $review->user->email,
                $review->star,
                $review->comment,
                $review->created_at->format('Y-m-d H:i:s'),
            ];
        }

        $filename = 'reviews_' . date('Y-m-d_H-i-s') . '.csv';

        $callback = function() use ($csvData) {
            $file = fopen('php://output', 'w');
            foreach ($csvData as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$filename}",
        ]);
    }
}