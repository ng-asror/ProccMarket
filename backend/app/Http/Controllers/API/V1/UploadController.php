<?php

namespace App\Http\Controllers\API\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Http\Controllers\Controller;
// use Intervention\Image\Laravel\Facades\Image;

class UploadController extends Controller
{
    /**
     * Rasm yuklash
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
            'type' => 'required|in:topic,post,avatar,section,description',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $image = $request->file('image');
            $type = $request->input('type');
            
            // Fayl nomini generatsiya qilish
            $filename = $this->generateFileName($image->getClientOriginalExtension());

            // Fayl yo'lini aniqlash
            $path = "images/{$type}s/{$filename}";

            // Faylni to'g'ridan-to'g'ri saqlash
            Storage::disk('public')->putFileAs("images/{$type}s", $image, $filename);

            // URL yaratish
            $url = asset('storage/'.$path);

            return response()->json([
                'success' => true,
                'message' => 'Image uploaded successfully',
                'data' => [
                    'filename' => $filename,
                    'path' => $path,
                    'url' => $url,
                    'size' => Storage::disk('public')->size($path),
                    'type' => $type
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unikal fayl nomi generatsiya qilish
     */
    private function generateFileName(string $extension): string
    {
        return Str::uuid() . '.' . $extension;
    }

    /**
     * Rasm turga qarab ishlov berish
     */
    // private function processImage($image, string $type)
    // {
    //     $img = Image::read($image->getRealPath());

    //     switch ($type) {
    //         case 'avatar':
    //             // Avatar uchun 150x150 kvadrat qilib kesish
    //             $img->cover(150, 150);
    //             break;
                
    //         case 'section':
    //             // Section uchun 400x200 nisbatda
    //             $img->cover(400, 200);
    //             break;
                
    //         case 'topic':
    //             // Topic uchun katta rasm, lekin max 800px kenglik
    //             if ($img->width() > 800) {
    //                 $img->resize(800, null, function ($constraint) {
    //                     $constraint->aspectRatio();
    //                     $constraint->upsize();
    //                 });
    //             }
    //             break;
                
    //         case 'post':
    //             // Post uchun o'rtacha o'lcham, max 600px kenglik
    //             if ($img->width() > 600) {
    //                 $img->resize(600, null, function ($constraint) {
    //                     $constraint->aspectRatio();
    //                     $constraint->upsize();
    //                 });
    //             }
    //             break;
    //     }

    //     // Sifatni sozlash (JPEG uchun 85%, PNG uchun asl holda qoldirish)
    //     return $img->encode($image->getClientOriginalExtension() === 'png' ? 'png' : 'jpg', 85);
    // }

    /**
     * Rasmni o'chirish (agar kerak bo'lsa)
     */
    public function deleteImage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'path' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $path = $request->input('path');
            
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Image deleted successfully'
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Image not found'
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete image',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}