<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBannerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->is_admin;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB
            'link' => 'nullable|url|max:500',
            'is_active' => 'boolean',
            'order' => 'integer|min:0',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after:starts_at',
        ];
    }

    /**
     * Get custom error messages
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Banner title is required',
            'title.max' => 'Banner title cannot exceed 255 characters',
            'description.max' => 'Description cannot exceed 1000 characters',
            'image.required' => 'Banner image is required',
            'image.image' => 'File must be an image',
            'image.mimes' => 'Image must be in JPEG, PNG, JPG, GIF, or WEBP format',
            'image.max' => 'Image size cannot exceed 5MB',
            'link.url' => 'Link must be a valid URL',
            'link.max' => 'Link cannot exceed 500 characters',
            'order.integer' => 'Order must be a number',
            'order.min' => 'Order cannot be negative',
            'starts_at.date' => 'Start date must be a valid date',
            'ends_at.date' => 'End date must be a valid date',
            'ends_at.after' => 'End date must be after start date',
        ];
    }
}

class UpdateBannerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->is_admin;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB
            'link' => 'nullable|url|max:500',
            'is_active' => 'boolean',
            'order' => 'integer|min:0',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after:starts_at',
        ];
    }

    /**
     * Get custom error messages
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Banner title is required',
            'title.max' => 'Banner title cannot exceed 255 characters',
            'description.max' => 'Description cannot exceed 1000 characters',
            'image.image' => 'File must be an image',
            'image.mimes' => 'Image must be in JPEG, PNG, JPG, GIF, or WEBP format',
            'image.max' => 'Image size cannot exceed 5MB',
            'link.url' => 'Link must be a valid URL',
            'link.max' => 'Link cannot exceed 500 characters',
            'order.integer' => 'Order must be a number',
            'order.min' => 'Order cannot be negative',
            'starts_at.date' => 'Start date must be a valid date',
            'ends_at.date' => 'End date must be a valid date',
            'ends_at.after' => 'End date must be after start date',
        ];
    }
}