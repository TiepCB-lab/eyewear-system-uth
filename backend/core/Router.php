<?php

namespace Core;

class Router
{
    private static array $routes = [];
    private static string $currentPrefix = '';
    private static array $currentMiddleware = [];

    public static function group(array $attributes, callable $callback): void
    {
        $previousPrefix = self::$currentPrefix;
        $previousMiddleware = self::$currentMiddleware;

        if (isset($attributes['prefix'])) {
            self::$currentPrefix .= '/' . trim($attributes['prefix'], '/');
        }
        if (isset($attributes['middleware'])) {
            if (is_array($attributes['middleware'])) {
                self::$currentMiddleware = array_merge(self::$currentMiddleware, $attributes['middleware']);
            } else {
                self::$currentMiddleware[] = $attributes['middleware'];
            }
        }

        call_user_func($callback);

        self::$currentPrefix = $previousPrefix;
        self::$currentMiddleware = $previousMiddleware;
    }

    public static function get(string $uri, array $action): self
    {
        self::addRoute('GET', $uri, $action);
        return new static();
    }

    public static function post(string $uri, array $action): self
    {
        self::addRoute('POST', $uri, $action);
        return new static();
    }

    public static function put(string $uri, array $action): self
    {
        self::addRoute('PUT', $uri, $action);
        return new static();
    }

    public static function delete(string $uri, array $action): self
    {
        self::addRoute('DELETE', $uri, $action);
        return new static();
    }

    public function middleware($middleware): self
    {
        $lastIdx = count(self::$routes) - 1;
        if ($lastIdx >= 0) {
            $mw = is_array($middleware) ? $middleware : [$middleware];
            self::$routes[$lastIdx]['middleware'] = array_merge(self::$routes[$lastIdx]['middleware'], $mw);
        }
        return $this;
    }

    private static function addRoute(string $method, string $uri, array $action): void
    {
        $path = self::$currentPrefix . '/' . trim($uri, '/');
        $path = rtrim($path, '/');
        if ($path === '') $path = '/';

        self::$routes[] = [
            'method' => $method,
            'uri' => $path,
            'action' => $action,
            'middleware' => self::$currentMiddleware
        ];
    }

    private static function runMiddleware(array $middleware): bool
    {
        foreach ($middleware as $item) {
            if (!is_string($item) || $item === '') {
                continue;
            }

            [$name, $parameter] = array_pad(explode(':', $item, 2), 2, null);

            if ($name === 'auth') {
                if (!\App\Http\Middleware\AuthMiddleware::handle($parameter)) {
                    return false;
                }
                continue;
            }

            if ($name === 'role') {
                $roles = $parameter ? array_values(array_filter(array_map('trim', explode('|', $parameter)))) : [];
                if (!\App\Http\Middleware\RoleMiddleware::handle($roles)) {
                    return false;
                }
                continue;
            }

            if ($name === 'permission') {
                $permissions = $parameter ? array_values(array_filter(array_map('trim', explode('|', $parameter)))) : [];
                if (!\App\Http\Middleware\PermissionMiddleware::handle($permissions)) {
                    return false;
                }
                continue;
            }

            if ($name === 'cors') {
                if (!\App\Http\Middleware\CorsMiddleware::handle()) {
                    return false;
                }
            }
        }

        return true;
    }

    public static function dispatch(string $method, string $uri): void
    {
        $uri = rtrim(parse_url($uri, PHP_URL_PATH), '/');
        if ($uri === '') $uri = '/';

        foreach (self::$routes as $route) {
            if ($route['method'] === $method && $route['uri'] === $uri) {
                if (!self::runMiddleware($route['middleware'])) {
                    return;
                }

                // Very basic Dependency Injection for simple controllers
                $controllerClass = $route['action'][0];
                $methodName = $route['action'][1];

                $constructorParams = [];
                if (method_exists($controllerClass, '__construct')) {
                    $refMethod = new \ReflectionMethod($controllerClass, '__construct');
                    foreach ($refMethod->getParameters() as $param) {
                        $type = $param->getType();
                        if ($type instanceof \ReflectionNamedType && !$type->isBuiltin()) {
                            $depClass = $type->getName();
                            $constructorParams[] = new $depClass();
                        } else {
                            $constructorParams[] = null;
                        }
                    }
                }

                $controller = new $controllerClass(...$constructorParams);
                $response = $controller->$methodName();
                if ($response !== null) {
                    if (is_array($response) || is_object($response)) {
                        echo json_encode($response);
                    } else {
                        echo $response;
                    }
                }
                return;
            }
        }

        http_response_code(404);
        echo json_encode(['message' => "Route $method $uri not found"]);
    }
}
