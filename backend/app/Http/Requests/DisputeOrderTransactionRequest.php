<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DisputeOrderTransactionRequest extends FormRequest
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
            'reason' => ['required', 'string', 'min:10', 'max:2000'],
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
            'reason.required' => 'Причина спора обязательна.',
            'reason.string' => 'Причина спора должна быть строкой.',
            'reason.min' => 'Причина спора должна содержать минимум 10 символов.',
            'reason.max' => 'Причина спора не должна превышать 2000 символов.',
        ];
    }

    public function attributes(): array
    {
        return [
            'reason' => 'причина спора',
        ];
    }
}
