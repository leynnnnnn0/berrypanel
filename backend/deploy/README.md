# BerryPanel Backend on Raspberry Pi

This is the backend checklist for testing the current BerryPanel MVP on your Pi.

## What This Can Test Now

- User registration and login.
- Laravel site folder creation under `/srv/berrypanel/users/{linux_username}/sites/{site}`.
- Public GitHub repository clone into the site folder when Git deploy is enabled.
- BerryPanel-generated site hostnames like `site-name.192.168.254.113.nip.io`.
- Per-site `.env` writing.
- Database record creation.
- Real MariaDB database/user creation when database provisioning is enabled.

## Not Ready Yet

- Nginx vhost generation for each site.
- SSL/Cloudflare.
- Queue, scheduler, and Reverb process management.

## Pi Packages

Install the runtime packages first:

```bash
sudo apt update
sudo apt install -y nginx mariadb-server php8.4-fpm php8.4-cli php8.4-mbstring php8.4-xml php8.4-curl php8.4-sqlite3 php8.4-mysql php8.4-zip php8.4-bcmath unzip git
```

If your Pi only has PHP 8.3 available, use the matching `php8.3-*` packages and set hosted sites to PHP 8.3 for now.

## Folders

```bash
sudo groupadd --force berrypanel
sudo usermod -aG berrypanel www-data
sudo mkdir -p /srv/berrypanel/users
sudo chown root:berrypanel /srv/berrypanel/users
sudo chmod 2775 /srv/berrypanel/users
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
BERRYPANEL_DATABASE_PROVISIONING_ENABLED=true
BERRYPANEL_MYSQL_ADMIN_USERNAME=berrypanel_admin
BERRYPANEL_MYSQL_ADMIN_PASSWORD=your-real-admin-password
```

Then:

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
