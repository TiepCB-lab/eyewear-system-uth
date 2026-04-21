<?php

function env_value(array $config, array $keys, $default = null)
{
    foreach ($keys as $key) {
        if (isset($config[$key]) && $config[$key] !== '') {
            return $config[$key];
        }
    }
    return $default;
}

function parse_env_file(string $path): array
{
    $result = [];
    $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return [];
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || str_starts_with($line, ';')) {
            continue;
        }

        if (!str_contains($line, '=')) {
            continue;
        }

        [$name, $value] = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);

        if (($value !== '') && (($value[0] === '"' && str_ends_with($value, '"')) || ($value[0] === "'" && str_ends_with($value, "'")))) {
            $value = substr($value, 1, -1);
        }

        $result[$name] = $value;
    }

    return $result;
}

function load_env_config()
{
    $backendRoot = dirname(dirname(__DIR__));
    $envPath = $backendRoot . DIRECTORY_SEPARATOR . '.env';
    $envLocalPath = $backendRoot . DIRECTORY_SEPARATOR . '.env.local';

    $envConfig = is_file($envPath) ? parse_env_file($envPath) : [];
    $localConfig = is_file($envLocalPath) ? parse_env_file($envLocalPath) : [];

    return array_merge($envConfig, $localConfig);
}
