<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\PartnershipApplication;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class PartnershipController extends Controller
{
    /**
     * Check if user can submit application
     */
    public function canApply(): JsonResponse
    {
        $user = Auth::user();

        $canApply = PartnershipApplication::canUserApply($user->id);
        
        $existingApplication = null;
        if (!$canApply) {
            $existingApplication = PartnershipApplication::where('user_id', $user->id)
                ->whereNull('deleted_at')
                ->first();
        }

        return response()->json([
            'success' => true,
            'can_apply' => $canApply,
            'existing_application' => $existingApplication ? [
                'id' => $existingApplication->id,
                'status' => $existingApplication->status,
                'status_label' => $existingApplication->status_label,
                'created_at' => $existingApplication->created_at->format('Y-m-d H:i:s'),
            ] : null,
        ]);
    }

    /**
     * Get user's current application
     */
    public function myApplication(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $application = PartnershipApplication::where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->first();

        if (!$application) {
            return response()->json([
                'success' => true,
                'application' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'application' => [
                'id' => $application->id,
                'processing_experience' => $application->processing_experience,
                'deposit_amount' => $application->deposit_amount,
                'about_yourself' => $application->about_yourself,
                'status' => $application->status,
                'status_label' => $application->status_label,
                'status_color' => $application->status_color,
                'admin_notes' => $application->admin_notes,
                'created_at' => $application->created_at->format('Y-m-d H:i:s'),
                'reviewed_at' => $application->reviewed_at?->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * Submit partnership application
     */
    public function submit(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Check if user already has an active application
        if (!PartnershipApplication::canUserApply($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an active application. Please wait for it to be reviewed.'
            ], 422);
        }

        // Validate request
        $validator = Validator::make($request->all(), [
            'processing_experience' => 'required|string|min:1|max:2000',
            'deposit_amount' => 'required|numeric|min:0|max:1000000000',
            'about_yourself' => 'required|string|min:1|max:2000',
        ], [
            'processing_experience.required' => 'Enter your processing and cryptocurrency experience',
            'processing_experience.min' => 'Write at least 1 characters about your experience',
            'processing_experience.max' => 'Maximum 2000 characters',
            'deposit_amount.required' => 'Enter deposit amount',
            'deposit_amount.numeric' => 'Deposit amount must be a number',
            'deposit_amount.min' => 'Minimum deposit amount is $0',
            'deposit_amount.max' => 'Maximum deposit amount is $1,000,000,000',
            'about_yourself.required' => 'Enter information about yourself',
            'about_yourself.min' => 'Write at least 1 characters about yourself',
            'about_yourself.max' => 'Maximum 2000 characters',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Create application
        $application = PartnershipApplication::create([
            'user_id' => $user->id,
            'processing_experience' => $request->processing_experience,
            'deposit_amount' => $request->deposit_amount,
            'about_yourself' => $request->about_yourself,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your application has been successfully submitted! It will be reviewed soon.',
            'application' => [
                'id' => $application->id,
                'status' => $application->status,
                'status_label' => $application->status_label,
                'created_at' => $application->created_at->format('Y-m-d H:i:s'),
            ],
        ], 201);
    }

    /**
     * Cancel user's own application (optional feature)
     */
    public function cancel(): JsonResponse
    {
        $user = Auth::user();

        $application = PartnershipApplication::where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->where('status', 'pending') // Only pending applications can be canceled
            ->first();

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'No application found to cancel'
            ], 404);
        }

        $application->delete(); // Soft delete

        return response()->json([
            'success' => true,
            'message' => 'Application canceled'
        ]);
    }
}