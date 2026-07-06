# BerryPanel Backend on Raspberry Pi

This is the backend checklist for testing the current BerryPanel MVP on your Pi.

## What This Can Test Now

- User registration and login.
- Laravel site folder creation under `/srv/berrypanel/users/{linux_username}/sites/{site}`.
- Public GitHub repository clone into the site folder when Git deploy is enabled.
- Composer install, Laravel app key generation, storage link, npm install, and frontend build for Laravel/Inertia apps.
- Per-site Nginx virtual host generation, config test, and reload when Nginx provisioning is enabled.
- BerryPanel-generated site hostnames like `site-name.192.168.254.113.nip.io`.
- Key-based SSH access for users so they can run Laravel commands inside their own workspace.
- Per-site `.env` writing.
- Database record creation.
- Real MariaDB database/user creation when database provisioning is enabled.

## Not Ready Yet

- SSL/Cloudflare.
- Queue, scheduler, and Reverb process management.

## Pi Packages

Install the runtime packages first:

```bash
sudo apt update
sudo apt install -y nginx openssh-server mariadb-server php8.4-fpm php8.4-cli php8.4-mbstring php8.4-xml php8.4-curl php8.4-sqlite3 php8.4-mysql php8.4-zip php8.4-bcmath unzip git composer nodejs npm
```

If your Pi only has PHP 8.3 available, use the matching `php8.3-*` packages and set hosted sites to PHP 8.3 for now.

## Folders

```bash
sudo groupadd --force berrypanel
sudo usermod -aG berrypanel www-data
sudo usermod -aG berrypanel $USER
sudo mkdir -p /srv/berrypanel/users
sudo chown root:berrypanel /srv/berrypanel/users
sudo chmod 2775 /srv/berrypanel/users
sudo systemctl enable --now ssh
```

Log out and back in after changing groups if needed.

## MariaDB Admin User

Create a constrained admin user for BerryPanel database provisioning:

```sql
CREATE USER IF NOT EXISTS 'berrypanel_admin'@'localhost' IDENTIFIED BY 'change-this-admin-password';
GRANT CREATE, ALTER, DROP, INDEX, SELECT, INSERT, UPDATE, DELETE, CREATE USER, RELOAD ON *.* TO 'berrypanel_admin'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

Use a real password, then put it in the backend `.env`.

## Backend Env

On the Pi:

```bash
cd /path/to/berrypanel/backend
cp .env.pi.example .env
php artisan key:generate
```

Edit `.env`:

```env
APP_URL=http://192.168.254.113
BERRYPANEL_USERS_ROOT=/srv/berrypanel/users
BERRYPANEL_SERVER_IP=192.168.254.113
BERRYPANEL_GIT_DEPLOY_ENABLED=true
BERRYPANEL_NGINX_PROVISIONING_ENABLED=true
BERRYPANEL_NGINX_SITES_AVAILABLE_PATH=/etc/nginx/sites-available
BERRYPANEL_NGINX_SITES_ENABLED_PATH=/etc/nginx/sites-enabled
BERRYPANEL_NGINX_PHP_FPM_SOCKET=/run/php/php8.4-fpm.sock
BERRYPANEL_SSH_PROVISIONING_ENABLED=true
BERRYPANEL_SSH_HOST=192.168.254.113
BERRYPANEL_SSH_PORT=22
BERRYPANEL_DATABASE_PROVISIONING_ENABLED=true
BERRYPANEL_MYSQL_ADMIN_USERNAME=berrypanel_admin
BERRYPANEL_MYSQL_ADMIN_PASSWORD=your-real-admin-password
```

## Nginx Site Provisioning

BerryPanel needs permission to install one Nginx config per hosted site, enable
it, test Nginx, and reload Nginx. For the current Pi MVP, allow the
`berrypanel` group to run only those commands without a password:

```bash
sudo visudo -f /etc/sudoers.d/berrypanel-nginx
```

Paste this:

```sudoers
%berrypanel ALL=(root) NOPASSWD: /usr/bin/cp, /usr/bin/ln, /usr/bin/unlink, /usr/sbin/nginx, /usr/bin/systemctl reload nginx
```

Then make sure the backend process user is in the `berrypanel` group and restart
the backend process. If you are testing with `php artisan serve`, log out and
back in, or run `newgrp berrypanel` before starting the server.

When a site is created, BerryPanel writes:

```text
/etc/nginx/sites-available/berrypanel-{site}.conf
/etc/nginx/sites-enabled/berrypanel-{site}.conf
```

Then it runs:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

For sites that already existed before Nginx provisioning was enabled, sync all
site configs:

```bash
php artisan berrypanel:nginx:sync
```

Or sync one site by slug:

```bash
php artisan berrypanel:nginx:sync test2
```

## SSH Access Provisioning

BerryPanel creates one Linux user per account and installs the public key that
the user pastes on the SSH Access page. This is key-based SSH only. BerryPanel
does not create or show SSH passwords.

Allow the `berrypanel` group to run the Linux account and key-file commands
without a password:

```bash
sudo visudo -f /etc/sudoers.d/berrypanel-ssh
```

Paste this:

```sudoers
%berrypanel ALL=(root) NOPASSWD: /usr/sbin/useradd, /usr/sbin/usermod, /usr/bin/mkdir, /usr/bin/cp, /usr/bin/chown, /usr/bin/chmod, /usr/bin/unlink
```

Restart the backend process after changing groups or sudoers. If you are using
UFW, allow SSH:

```bash
sudo ufw allow 22/tcp
```

The user creates a key on their own computer:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/berrypanel -C "berrypanel"
cat ~/.ssh/berrypanel.pub
```

They paste the public key into BerryPanel. After that they can connect:

```bash
ssh -i ~/.ssh/berrypanel -p 22 user_1@192.168.254.113
cd sites/test2
php artisan migrate --force
php artisan key:generate --force
```

If SSH says `Permission denied (publickey)`, check the Pi:

```bash
sudo ls -la /srv/berrypanel/users/user_1/.ssh
sudo cat /srv/berrypanel/users/user_1/.ssh/authorized_keys
sudo tail -n 80 /var/log/auth.log
```

The public key in `authorized_keys` must match the public key from the user's
computer:

```bash
cat ~/.ssh/berrypanel.pub
```

Finish the backend app install:

```bash
composer install --no-dev --optimize-autoloader
mkdir -p database
touch database/database.sqlite
php artisan migrate --force
php artisan storage:link
php artisan config:clear
php artisan berrypanel:doctor
```

## Nginx Backend API

Use `deploy/nginx-berrypanel-backend.conf` as a starting point and update:

- `server_name`
- `root`
- PHP-FPM socket version

Then:

```bash
sudo ln -s /path/to/berrypanel/backend/deploy/nginx-berrypanel-backend.conf /etc/nginx/sites-enabled/berrypanel-backend
sudo nginx -t
sudo systemctl reload nginx
```

## Frontend API URL

Point the frontend to the Pi backend:

```env
NEXT_PUBLIC_API_URL=http://192.168.254.113
```

For local Wi-Fi testing, keep everything on HTTP first. Add Cloudflare/SSL only after the local MVP works.
