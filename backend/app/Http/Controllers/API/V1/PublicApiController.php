<?php

namespace App\Http\Controllers\API\V1;

use App\Models\Role;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;

class PublicApiController extends Controller
{
    /**
     * Get all roles with their user counts.
     */
    public function getRoles(): JsonResponse
    {
        $roles = Role::withCount('users')->get();

        return response()->json([
            "success" => true,
            'message' => 'Roles retrieved successfully',
            'roles' => $roles,
        ], 200);
    }

    /**
     * Get all settings.
     */
    public function getSettings(): JsonResponse
    {
        $excludedKeys = ['crypto_bot_token', 'bot_token'];

        $settings = Setting::whereNotIn('key', $excludedKeys)
            ->get(['key', 'name', 'value']);

        return response()->json([
            "success" => true,
            'message' => 'Settings retrieved successfully',
            'settings' => $settings,
        ], 200);
    }


    /**
     * Get a specific setting by key.
     */
    public function getSettingByKey(string $key): JsonResponse
    {
        $excludedKeys = ['crypto_bot_token', 'bot_token'];

        if (in_array($key, $excludedKeys)) {
            return response()->json([
                "success" => false,
                'message' => 'Access to this setting is restricted',
            ], 403);
        }

        $setting = Setting::where('key', $key)->first(['key', 'name', 'value']);

        if (!$setting) {
            return response()->json([
                "success" => false,
                'message' => 'Setting not found',
            ], 404);
        }

        return response()->json([
            "success" => true,
            'message' => 'Setting retrieved successfully',
            'setting' => $setting,
        ], 200);
    }


    public function allPublicData(): JsonResponse
    {
        $roles = Role::withCount('users')->get();
        $settings = Setting::all(['key', 'name', 'value']);

        return response()->json([
            "success" => true,
            'message' => 'Public data retrieved successfully',
            'roles' => $roles,
            'settings' => $settings,
        ], 200);
    }
}