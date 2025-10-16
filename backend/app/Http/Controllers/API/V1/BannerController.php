<?php

namespace App\Http\Controllers\API\V1;

use App\Models\Banner;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Http\Controllers\Controller;

class BannerController extends Controller
{
    /**
     * Get active banners for public display
     */
    public function index()
    {
        $banners = Banner::active()
            ->ordered()
            ->get()
            ->map(function ($banner) {
                return [
                    'id' => $banner->id,
                    'title' => $banner->title,
                    'description' => $banner->description,
                    'image_url' => $banner->image_url,
                    'link' => $banner->link,
                ];
            });

        return response()->json([
            'success' => true,
            'banners' => $banners
        ]);
    }
}