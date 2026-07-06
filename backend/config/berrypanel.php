<?php

return [
    'users_root' => env('BERRYPANEL_USERS_ROOT') ?: storage_path('app/berrypanel/users'),
    'server_ip' => env('BERRYPANEL_SERVER_IP'),
    'site_domain_suffix' => env('BERRYPANEL_SITE_DOMAIN_SUFFIX'),
    'database_provisioning_enabled' => (bool) env('BERRYPANEL_DATABASE_PROVISIONING_ENABLED', false),
    'mysql_admin_host' => env('BERRYPANEL_MYSQL_ADMIN_HOST', '127.0.0.1'),
    'mysql_admin_port' => (int) env('BERRYPANEL_MYSQL_ADMIN_PORT', 3306),
    'mysql_admin_username' => env('BERRYPANEL_MYSQL_ADMIN_USERNAME', 'root'),
    'mysql_admin_password' => env('BERRYPANEL_MYSQL_ADMIN_PASSWORD', ''),
    'mysql_user_host' => env('BERRYPANEL_MYSQL_USER_HOST', 'localhost'),
];
