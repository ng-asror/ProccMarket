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
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:10000'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999.99'],
            'deadline' => ['nullable', 'date', 'after:now'],
            'is_client_order' => ['nullable', 'boolean'],
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
            'conversation_id.required' => 'ID чата обязателен.',
            'conversation_id.integer' => 'ID чата должен быть числом.',
            'conversation_id.exists' => 'Указанный чат не существует.',
            
            'title.required' => 'Название заказа обязательно.',
            'title.string' => 'Название заказа должно быть строкой.',
            'title.max' => 'Название заказа не должно превышать 255 символов.',
            
            'description.required' => 'Описание заказа обязательно.',
            'description.string' => 'Описание заказа должно быть строкой.',
            'description.max' => 'Описание заказа не должно превышать 10 000 символов.',
            
            'amount.required' => 'Сумма заказа обязательна.',
            'amount.numeric' => 'Сумма заказа должна быть числом.',
            'amount.min' => 'Сумма заказа должна быть не менее 0.01.',
            'amount.max' => 'Сумма заказа не должна превышать 999 999.99.',
            
            'deadline.date' => 'Срок должен быть допустимой датой.',
            'deadline.after' => 'Срок должен быть в будущем.',
            
            'is_client_order.boolean' => 'Тип заказа должен быть логическим значением.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'conversation_id' => 'ID чата',
            'title' => 'название заказа',
            'description' => 'описание заказа',
            'amount' => 'сумма заказа',
            'deadline' => 'срок выполнения',
            'is_client_order' => 'тип заказа',
        ];
    }
}