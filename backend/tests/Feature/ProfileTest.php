<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_get_profile()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
                        ->getJson('/api/profile');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'profile' => [
                        'id',
                        'user_id',
                        'phone',
                        'address',
                        'avatar',
                        'birthdate',
                    ],
                ]);
    }

    public function test_user_can_update_profile()
    {
        $user = User::factory()->create();

        $profileData = [
            'phone' => '+1234567890',
            'address' => '123 Test Street',
            'birthdate' => '1990-01-01',
        ];

        $response = $this->actingAs($user, 'sanctum')
                        ->putJson('/api/profile', $profileData);

        $response->assertStatus(200)
                ->assertJson([
                    'message' => 'Profile updated successfully',
                ]);

        $this->assertDatabaseHas('profiles', [
            'user_id' => $user->id,
            'phone' => '+1234567890',
            'address' => '123 Test Street',
            'birthdate' => '1990-01-01',
        ]);
    }

    public function test_unauthenticated_user_cannot_update_profile()
    {
        $profileData = [
            'phone' => '+1234567890',
        ];

        $response = $this->putJson('/api/profile', $profileData);

        $response->assertStatus(401);
    }
}