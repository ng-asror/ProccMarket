<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendMessageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'content' => ['nullable', 'string', 'max:10000', 'required_without:file'],
            'file' => ['nullable', 'file', 'max:10240', 'required_without:content'],
            'reply_to_message_id' => ['nullable', 'integer', 'exists:messages,id'],
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'content.required_without' => 'Either message content or a file is required.',
            'file.required_without' => 'Either a file or message content is required.',
            'file.max' => 'File size must not exceed 10MB.',
            'reply_to_message_id.exists' => 'The message you are replying to does not exist.',
        ];
    }
}
