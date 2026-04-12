<?php

namespace Tests;

/**
 * Base test case for the custom PHP framework.
 * Provides common setup/teardown logic for all tests.
 */
abstract class TestCase
{
    protected function setUp(): void
    {
        // Override in child tests for setup logic
    }

    protected function tearDown(): void
    {
        // Override in child tests for cleanup logic
    }
}