<?php

namespace App\Services;

use PDO;
use RuntimeException;

class DatabaseProvisioner
{
    public function provision(string $databaseName, string $username, string $password): void
    {
        if (! (bool) config('berrypanel.database_provisioning_enabled')) {
            return;
        }

        $this->ensureIdentifierIsSafe($databaseName, 'database name');
        $this->ensureIdentifierIsSafe($username, 'database username');

        try {
            $pdo = new PDO(
                sprintf(
                    'mysql:host=%s;port=%d;charset=utf8mb4',
                    config('berrypanel.mysql_admin_host'),
                    config('berrypanel.mysql_admin_port'),
                ),
                (string) config('berrypanel.mysql_admin_username'),
                (string) config('berrypanel.mysql_admin_password'),
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ],
            );

            $userHost = (string) config('berrypanel.mysql_user_host');
            $quotedUser = $pdo->quote($username);
            $quotedHost = $pdo->quote($userHost);
            $quotedPassword = $pdo->quote($password);

            $pdo->exec("CREATE DATABASE IF NOT EXISTS {$this->quoteIdentifier($databaseName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("CREATE USER IF NOT EXISTS {$quotedUser}@{$quotedHost} IDENTIFIED BY {$quotedPassword}");
            $pdo->exec("ALTER USER {$quotedUser}@{$quotedHost} IDENTIFIED BY {$quotedPassword}");
            $pdo->exec("GRANT ALL PRIVILEGES ON {$this->quoteIdentifier($databaseName)}.* TO {$quotedUser}@{$quotedHost}");
            $pdo->exec('FLUSH PRIVILEGES');
        } catch (\Throwable $exception) {
            throw new RuntimeException(
                'BerryPanel could not create the MariaDB database/user. Check the MySQL admin credentials on the Pi.',
                previous: $exception,
            );
        }
    }

    public function drop(string $databaseName, string $username): void
    {
        if (! (bool) config('berrypanel.database_provisioning_enabled')) {
            return;
        }

        $this->ensureIdentifierIsSafe($databaseName, 'database name');
        $this->ensureIdentifierIsSafe($username, 'database username');

        try {
            $pdo = new PDO(
                sprintf(
                    'mysql:host=%s;port=%d;charset=utf8mb4',
                    config('berrypanel.mysql_admin_host'),
                    config('berrypanel.mysql_admin_port'),
                ),
                (string) config('berrypanel.mysql_admin_username'),
                (string) config('berrypanel.mysql_admin_password'),
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
            );

            $quotedUser = $pdo->quote($username);
            $quotedHost = $pdo->quote((string) config('berrypanel.mysql_user_host'));

            $pdo->exec("DROP DATABASE IF EXISTS {$this->quoteIdentifier($databaseName)}");
            $pdo->exec("DROP USER IF EXISTS {$quotedUser}@{$quotedHost}");
            $pdo->exec('FLUSH PRIVILEGES');
        } catch (\Throwable $exception) {
            throw new RuntimeException(
                'BerryPanel could not delete the MariaDB database/user. Check the MySQL admin credentials on the Pi.',
                previous: $exception,
            );
        }
    }

    private function ensureIdentifierIsSafe(string $identifier, string $label): void
    {
        if (! preg_match('/^[a-zA-Z0-9_]{1,64}$/', $identifier)) {
            throw new RuntimeException("The {$label} is not a safe MySQL identifier.");
        }
    }

    private function quoteIdentifier(string $identifier): string
    {
        return '`'.str_replace('`', '``', $identifier).'`';
    }
}
