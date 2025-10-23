<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PartnershipApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PartnershipApplicationController extends Controller
{
    /**
     * Display all partnership applications
     */
    public function index(Request $request): Response
    {
        $query = PartnershipApplication::with(['user', 'reviewer'])
            ->orderBy('created_at', 'desc');

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'like', "%{$search}%")
                             ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhere('processing_experience', 'like', "%{$search}%")
                ->orWhere('about_yourself', 'like', "%{$search}%");
            });
        }

        // Apply status filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Apply date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $applications = $query->paginate(20)->through(function ($app) {
            return [
                'id' => $app->id,
                'user' => [
                    'id' => $app->user->id,
                    'name' => $app->user->name,
                    'email' => $app->user->email,
                    'avatar' => $app->user->avatar,
                    'avatar_url' => $app->user->avatar_url,
                ],
                'processing_experience' => $app->processing_experience,
                'deposit_amount' => $app->deposit_amount,
                'about_yourself' => $app->about_yourself,
                'status' => $app->status,
                'status_label' => $app->status_label,
                'status_color' => $app->status_color,
                'admin_notes' => $app->admin_notes,
                'reviewed_at' => $app->reviewed_at?->format('Y-m-d H:i:s'),
                'reviewer' => $app->reviewer ? [
                    'id' => $app->reviewer->id,
                    'name' => $app->reviewer->name,
                ] : null,
                'created_at' => $app->created_at->format('Y-m-d H:i:s'),
            ];
        });

        // Calculate statistics
        $stats = [
            'total' => PartnershipApplication::count(),
            'pending' => PartnershipApplication::where('status', 'pending')->count(),
            'under_review' => PartnershipApplication::where('status', 'under_review')->count(),
            'approved' => PartnershipApplication::where('status', 'approved')->count(),
            'rejected' => PartnershipApplication::where('status', 'rejected')->count(),
        ];

        return Inertia::render('admin/partnerships/index', [
            'applications' => $applications,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Display single application details
     */
    public function show(PartnershipApplication $application): Response
    {
        $application->load(['user', 'reviewer']);

        return Inertia::render('admin/partnerships/show', [
            'application' => [
                'id' => $application->id,
                'user' => [
                    'id' => $application->user->id,
                    'name' => $application->user->name,
                    'email' => $application->user->email,
                    'avatar' => $application->user->avatar,
                    'balance' => $application->user->balance,
                    'created_at' => $application->user->created_at->format('Y-m-d H:i:s'),
                ],
                'processing_experience' => $application->processing_experience,
                'deposit_amount' => $application->deposit_amount,
                'about_yourself' => $application->about_yourself,
                'status' => $application->status,
                'status_label' => $application->status_label,
                'status_color' => $application->status_color,
                'admin_notes' => $application->admin_notes,
                'reviewed_at' => $application->reviewed_at?->format('Y-m-d H:i:s'),
                'reviewer' => $application->reviewer ? [
                    'id' => $application->reviewer->id,
                    'name' => $application->reviewer->name,
                ] : null,
                'created_at' => $application->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $application->updated_at->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * Delete application (soft delete)
     */
    public function destroy(PartnershipApplication $application)
    {
        $application->delete();

        return redirect()->route('admin.partnerships.index')
            ->with('success', 'Ariza o\'chirildi. Foydalanuvchi endi yangi ariza yuborishi mumkin.');
    }

    /**
     * Bulk delete applications
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:partnership_applications,id'
        ]);

        PartnershipApplication::whereIn('id', $request->ids)->delete();

        return back()->with('success', count($request->ids) . ' ta ariza o\'chirildi');
    }

    /**
     * Update application status (optional - for future use)
     */
    public function updateStatus(Request $request, PartnershipApplication $application)
    {
        $request->validate([
            'status' => 'required|in:pending,under_review,approved,rejected',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        $application->update([
            'status' => $request->status,
            'admin_notes' => $request->admin_notes,
            'reviewed_at' => now(),
            'reviewed_by' => auth()->id(),
        ]);

        return back()->with('success', 'Ariza holati yangilandi');
    }

    /**
     * Export applications to CSV
     */
    public function export(Request $request)
    {
        $query = PartnershipApplication::with('user')->orderBy('created_at', 'desc');

        // Apply same filters as index
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'like', "%{$search}%")
                             ->orWhere('email', 'like', "%{$search}%");
                });
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $applications = $query->get();

        $csvData = [];
        $csvData[] = ['ID', 'User', 'Email', 'Deposit Amount', 'Status', 'Created At'];

        foreach ($applications as $app) {
            $csvData[] = [
                $app->id,
                $app->user->name ?? 'N/A',
                $app->user->email,
                $app->deposit_amount,
                $app->status_label,
                $app->created_at->format('Y-m-d H:i:s'),
            ];
        }

        $filename = 'partnership_applications_' . date('Y-m-d_H-i-s') . '.csv';

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