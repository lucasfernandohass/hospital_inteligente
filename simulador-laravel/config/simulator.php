<?php

return [
    'api_url' => env('JAVA_API_URL', 'http://localhost:8080'),
    'api_key' => env('MONITOR_API_KEY', ''),
    'java_email' => env('JAVA_API_EMAIL', ''),
    'java_password' => env('JAVA_API_PASSWORD', ''),
    'interval_seconds' => max(1, (int) env('SIMULATOR_INTERVAL_SECONDS', 5)),
    'scenario' => env('SIMULATOR_SCENARIO', 'estavel'),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
    'auto_start' => filter_var(env('SIMULATOR_AUTO_START', true), FILTER_VALIDATE_BOOLEAN),
];
