<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RevisionOrderTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => 'nullable|string|min:10|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'reason.min' => 'Причина обработки должна содержать не менее 10 символов.',
            'reason.max' => 'Причина обработки не должна превышать 500 символов.',
        ];
    }
}