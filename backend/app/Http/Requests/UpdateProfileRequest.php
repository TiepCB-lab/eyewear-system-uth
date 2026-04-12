<?php

namespace App\Http\Requests;

/**
 * Validation rules for profile update requests.
 */
class UpdateProfileRequest
{
    public static function rules(): array
    {
        return [
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'birthdate' => 'nullable|date|before:today',
        ];
    }

    public static function validate(array $data): array
    {
        $errors = [];

        if (isset($data['phone']) && strlen($data['phone']) > 20) {
            $errors['phone'] = 'Phone must be at most 20 characters';
        }

        if (isset($data['address']) && strlen($data['address']) > 500) {
            $errors['address'] = 'Address must be at most 500 characters';
        }

        if (isset($data['birthdate'])) {
            $date = strtotime($data['birthdate']);
            if ($date === false) {
                $errors['birthdate'] = 'Birthdate must be a valid date';
            } elseif ($date >= time()) {
                $errors['birthdate'] = 'Birthdate must be before today';
            }
        }

        return $errors;
    }
}