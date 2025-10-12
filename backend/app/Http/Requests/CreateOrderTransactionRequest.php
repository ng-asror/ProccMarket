<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateOrderTransactionRequest extends FormRequest
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
            'conversation_id' => ['required', 'integer', 'exists:conversations,id'],
            'executor_id' => ['required', 'integer', 'exists:users,id', 'different:auth_user_id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:10000'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999.99'],
            'deadline' => ['nullable', 'date', 'after:now'],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'auth_user_id' => $this->user()->id,
        ]);
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'conversation_id.required' => 'Conversation ID is required.',
            'conversation_id.exists' => 'The specified conversation does not exist.',
            'executor_id.required' => 'Executor ID is required.',
            'executor_id.exists' => 'The specified executor does not exist.',
            'executor_id.different' => 'You cannot create an order for yourself.',
            'title.required' => 'Order title is required.',
            'title.max' => 'Order title must not exceed 255 characters.',
            'description.required' => 'Order description is required.',
            'description.max' => 'Order description must not exceed 10,000 characters.',
            'amount.required' => 'Order amount is required.',
            'amount.numeric' => 'Order amount must be a number.',
            'amount.min' => 'Order amount must be at least $0.01.',
            'amount.max' => 'Order amount must not exceed $999,999.99.',
            'deadline.date' => 'Deadline must be a valid date.',
            'deadline.after' => 'Deadline must be in the future.',
        ];
    }
}
