<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateBillingCheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'plan' => [
                'required',
                'string',
                Rule::exists('billing_plans', 'slug')->where(fn ($query) => $query->where('active', true)),
            ],
        ];
    }
}
