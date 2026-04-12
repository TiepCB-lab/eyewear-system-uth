<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Auth Feature Tests — Placeholder for when test runner is configured.
 * 
 * These test cases document the expected behavior of the auth endpoints.
 * They currently serve as documentation and will be executable once
 * a PHPUnit/test infrastructure is set up for the custom framework.
 */
class AuthTest extends TestCase
{
    // TODO: Implement test_user_can_register
    // POST /api/auth/register with {name, email, password}
    // Expected: 201 with {message, user: {id, name, email, role}, token}

    // TODO: Implement test_user_can_login_with_correct_credentials
    // POST /api/auth/login with {email, password}
    // Expected: 200 with {message, user, token}

    // TODO: Implement test_user_cannot_login_with_wrong_credentials
    // POST /api/auth/login with wrong password
    // Expected: 401 with {message: 'Invalid credentials'}

    // TODO: Implement test_authenticated_user_can_get_profile
    // GET /api/auth/me with Authorization header
    // Expected: 200 with {user: {id, name, email, role}}

    // TODO: Implement test_unauthenticated_user_cannot_access_protected_routes
    // GET /api/auth/me without token
    // Expected: 401
}