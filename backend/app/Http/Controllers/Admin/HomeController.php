<?php

namespace App\Http\Controllers\Admin;

use App\Models\Banner;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Http\Controllers\Controller;

class HomeController extends Controller
{
    /**
     * Display the home page with active banners
     */
    public function index(): Response
    {
        // Get active banners ordered by custom order
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

        return Inertia::render('dashboard', [
            'banners' => $banners,
        ]);
    }
}
