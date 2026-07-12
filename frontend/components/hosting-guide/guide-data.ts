export type GuideTabId =
  | "start"
  | "deploy"
  | "commands"
  | "errors"
  | "domains"
  | "limits";

export type GuideTab = {
  id: GuideTabId;
  label: string;
  summary: string;
};

export type GuideStep = {
  title: string;
  description: string;
  details: string[];
};

export type AcceptedCommand = {
  command: string;
  purpose: string;
  whenToUse: string;
};

export type ErrorPlaybook = {
  id: string;
  title: string;
  symptoms: string[];
  cause: string;
  fixes: string[];
  commands?: string[];
  owner: "customer" | "support";
};

export const guideTabs: GuideTab[] = [
  {
    id: "start",
    label: "Start here",
    summary: "Prepare your project for a smooth deployment.",
  },
  {
    id: "deploy",
    label: "Deploy Laravel",
    summary: "From GitHub to a live application.",
  },
  {
    id: "commands",
    label: "Commands",
    summary: "Supported Laravel commands available in the site terminal.",
  },
  {
    id: "errors",
    label: "Error helper",
    summary: "Paste an error and get the likely cause and next action.",
  },
  {
    id: "domains",
    label: "Domains",
    summary: "How hosted URLs, HTTPS, and custom domains work.",
  },
  {
    id: "limits",
    label: "Limits & safety",
    summary: "Understand account limits and safe tools.",
  },
];

export const repositoryRequirements = [
  "The repository must be public on GitHub for the current MVP.",
  "The repository root should contain a Laravel project, including artisan and composer.json.",
  "Laravel + Inertia projects should include package.json, vite.config.*, and a build script.",
  "Backend-only Laravel APIs are supported. If the project has no frontend assets, npm build can be skipped.",
  "Do not commit secrets. Add app keys, database credentials, and mail settings from the site page after deployment.",
];

export const hostingSteps: GuideStep[] = [
  {
    title: "Create a new Laravel site",
    description:
      "Open Dashboard, choose New Laravel Site, then provide the site name, public GitHub URL, and branch.",
    details: [
      "The site name becomes the public subdomain.",
      "Example: tinybubbles becomes tinybubbles.sites.capstoneprototype.online.",
      "Use a short, memorable name with letters, numbers, or hyphens.",
    ],
  },
  {
    title: "BerryPanel prepares the site",
    description:
      "BerryPanel creates the hosted site, pulls the repository, prepares Laravel runtime folders, and records deploy activity.",
    details: [
      "The repository is deployed to the hosting workspace assigned to your account.",
      "The public URL is created from the site name.",
      "Open the site page after deployment to finish runtime settings.",
    ],
  },
  {
    title: "Install runtime dependencies",
    description:
      "Composer and npm are prepared during deploy. If one step needs attention, finish it from the site terminal.",
    details: [
      "Composer install prepares vendor dependencies.",
      "npm install prepares node_modules when the app has a frontend.",
      "npm run build generates production assets for Vite and Inertia.",
    ],
  },
  {
    title: "Create and connect a database",
    description:
      "Use the Databases page to create a MySQL database, then copy the credentials into the site's environment form.",
    details: [
      "Use the generated database name, username, password, host, and port.",
      "After saving environment values, run migrations from the site terminal.",
      "For session table errors, either migrate the sessions table or use file sessions.",
    ],
  },
  {
    title: "Finish Laravel runtime",
    description:
      "Generate an app key, clear cached config, run migrations, and verify the public URL.",
    details: [
      "APP_URL should match the generated HTTPS public subdomain.",
      "APP_KEY must not be blank. Generate it if the project did not include one.",
      "When the site works, the status should move from Needs configuration to Running.",
    ],
  },
];

export const acceptedCommands: AcceptedCommand[] = [
  {
    command: "composer install",
    purpose: "Install PHP dependencies from composer.lock or composer.json.",
    whenToUse: "After cloning a Laravel repository or when vendor is missing.",
  },
  {
    command: "composer install --no-dev --optimize-autoloader",
    purpose: "Install production PHP dependencies with optimized autoloading.",
    whenToUse: "For production-like Laravel sites after the repository is stable.",
  },
  {
    command: "npm install",
    purpose: "Install frontend dependencies from package.json.",
    whenToUse: "When node_modules is missing and the app has Vite, Inertia, React, or Vue.",
  },
  {
    command: "npm install --include=dev --production=false --no-audit --no-fund",
    purpose: "Install dev dependencies required by Vite builds.",
    whenToUse: "When npm run build says vite is not found.",
  },
  {
    command: "npm run build",
    purpose: "Generate production frontend assets into public/build.",
    whenToUse: "After npm install or after pulling frontend changes.",
  },
  {
    command: "php artisan key:generate --force",
    purpose: "Create or replace APP_KEY for encrypted Laravel data.",
    whenToUse: "When APP_KEY is blank or Laravel reports an unsupported cipher/key length.",
  },
  {
    command: "php artisan migrate --force",
    purpose: "Run database migrations in production mode.",
    whenToUse: "After database credentials are saved or when tables are missing.",
  },
  {
    command: "php artisan migrate:fresh --seed --force",
    purpose: "Drop all tables, recreate them, and seed data.",
    whenToUse: "Only for disposable test sites. This deletes existing database data.",
  },
  {
    command: "php artisan db:seed --force",
    purpose: "Run database seeders in production mode.",
    whenToUse: "When the app needs starter data after migrations.",
  },
  {
    command: "php artisan storage:link",
    purpose: "Create the public storage symlink.",
    whenToUse: "When uploaded files or storage images are not accessible.",
  },
  {
    command: "php artisan optimize:clear",
    purpose: "Clear config, route, view, and app caches.",
    whenToUse: "After changing .env or when Laravel still uses old settings.",
  },
  {
    command: "php artisan config:cache",
    purpose: "Cache Laravel configuration for faster production requests.",
    whenToUse: "After the app is configured and stable.",
  },
  {
    command: "php artisan queue:restart",
    purpose: "Gracefully restart Laravel queue workers.",
    whenToUse: "After deploying code changes for queued jobs.",
  },
  {
    command: "git pull origin main",
    purpose: "Pull the latest code from the main branch.",
    whenToUse: "When your GitHub repository has new commits.",
  },
  {
    command: "tail -n 80 storage/logs/laravel.log",
    purpose: "Read the latest Laravel error logs.",
    whenToUse: "When the browser shows 500 Server Error or a blank page.",
  },
];

export const errorPlaybooks: ErrorPlaybook[] = [
  {
    id: "vite-not-found",
    title: "Frontend build failed: vite not found",
    symptoms: ["vite: not found", "frontend build failed"],
    cause:
      "The repository has a Vite build script, but the dev dependency that provides vite was not installed.",
    fixes: [
      "Install npm dependencies including dev dependencies.",
      "Run the frontend build again.",
      "If the project is backend-only and does not need assets, the warning can be ignored after the backend is running.",
    ],
    commands: [
      "npm install --include=dev --production=false --no-audit --no-fund",
      "npm run build",
    ],
    owner: "customer",
  },
  {
    id: "composer-home",
    title: "Composer HOME or COMPOSER_HOME must be set",
    symptoms: ["composer_home", "home or composer_home", "composer to run correctly"],
    cause:
      "Composer could not prepare its temporary working directory during deployment.",
    fixes: [
      "Retry Composer from the site terminal.",
      "If it still fails, contact support so the deployment environment can be repaired.",
    ],
    commands: ["composer install"],
    owner: "support",
  },
  {
    id: "app-key",
    title: "APP_KEY is missing or invalid",
    symptoms: [
      "unsupported cipher",
      "incorrect key length",
      "no application encryption key",
      "app_key",
    ],
    cause:
      "Laravel encryption needs a valid APP_KEY. This can happen when .env was overwritten or the project was newly cloned.",
    fixes: [
      "Generate a new application key.",
      "Clear cached config so Laravel reads the new .env value.",
      "Do not leave APP_KEY blank when saving environment settings.",
    ],
    commands: ["php artisan key:generate --force", "php artisan optimize:clear"],
    owner: "customer",
  },
  {
    id: "sessions-table",
    title: "Database sessions table does not exist",
    symptoms: ["sessions' doesn't exist", "table 'sessions'", "base table or view not found"],
    cause:
      "The app is using database sessions, but the sessions migration has not created the sessions table yet.",
    fixes: [
      "Run migrations after database credentials are saved.",
      "If you prefer file sessions for simple sites, set SESSION_DRIVER=file and clear config.",
    ],
    commands: ["php artisan migrate --force", "php artisan optimize:clear"],
    owner: "customer",
  },
  {
    id: "log-permission",
    title: "Laravel cannot write storage logs",
    symptoms: ["laravel.log", "permission denied", "streamhandler"],
    cause:
      "The app cannot write its Laravel log file.",
    fixes: [
      "Clear config after confirming .env is valid.",
      "If the error remains, contact support so file permissions can be repaired.",
    ],
    commands: ["php artisan optimize:clear"],
    owner: "support",
  },
  {
    id: "db-access",
    title: "Database access denied",
    symptoms: ["access denied for user", "sqlstate[hy000] [1045]", "using password"],
    cause:
      "The DB_USERNAME, DB_PASSWORD, DB_DATABASE, or DB_HOST value in .env does not match the database that was created.",
    fixes: [
      "Copy the credentials from the Databases page again.",
      "Save .env and clear Laravel config.",
      "Run migrations after the connection works.",
    ],
    commands: ["php artisan optimize:clear", "php artisan migrate --force"],
    owner: "customer",
  },
  {
    id: "missing-driver",
    title: "PHP database driver is missing",
    symptoms: ["could not find driver", "pdoexception", "connection: sqlite"],
    cause:
      "The app is trying to use a database driver that is not installed or the .env connection is set incorrectly.",
    fixes: [
      "Use MySQL/MariaDB credentials for hosted Laravel sites.",
      "If a required PHP extension is missing, contact support.",
    ],
    owner: "support",
  },
  {
    id: "dns",
    title: "Domain or subdomain does not resolve",
    symptoms: ["err_name_not_resolved", "server ip address could not be found", "dns"],
    cause:
      "The public hostname is not ready yet or the domain is not pointing to BerryPanel.",
    fixes: [
      "Use the public URL shown on the site page.",
      "Wait a few minutes for DNS propagation.",
      "Contact support if the URL still cannot be resolved after propagation.",
    ],
    owner: "support",
  },
  {
    id: "ssl",
    title: "Browser reports SSL protocol or cipher mismatch",
    symptoms: ["err_ssl_version_or_cipher_mismatch", "unsupported protocol", "secure connection"],
    cause:
      "The public HTTPS route for this hostname is not ready or the browser is opening the wrong protocol.",
    fixes: [
      "Use the generated https:// public URL from the site page.",
      "Refresh after a few minutes if the site was just created.",
      "Contact support if the secure connection error continues.",
    ],
    owner: "support",
  },
  {
    id: "cors-fetch",
    title: "Failed to fetch or CORS preflight failed",
    symptoms: ["failed to fetch", "cors", "access-control-allow-origin", "preflight"],
    cause:
      "The panel cannot reach the BerryPanel API from the current browser session.",
    fixes: [
      "Refresh the page and try again.",
      "Sign out and sign in again if the session was open during an update.",
      "Contact support if login or site actions still fail.",
    ],
    owner: "support",
  },
  {
    id: "bad-gateway",
    title: "502 Bad Gateway",
    symptoms: ["502", "bad gateway"],
    cause:
      "BerryPanel reached the hosted app, but the app did not respond correctly.",
    fixes: [
      "Open the site page and check the deploy warning.",
      "Use the Error helper with the latest Laravel log text.",
      "Contact support if the app log does not show a clear cause.",
    ],
    owner: "support",
  },
  {
    id: "not-found",
    title: "404 Not Found after creating a site",
    symptoms: ["404", "not found"],
    cause:
      "The site URL is not matched to a deployed Laravel public entry yet, or the repository does not contain a Laravel public entry.",
    fixes: [
      "Confirm the site URL shown in BerryPanel matches the browser URL.",
      "Confirm the repository has a public/index.php file.",
      "Contact support if the deployed site still returns 404.",
    ],
    owner: "support",
  },
];

export const domainGuides = [
  {
    title: "Hosted site URLs",
    value: "*.sites.capstoneprototype.online",
    description:
      "Each site receives a public HTTPS URL based on its site name.",
  },
  {
    title: "Custom domains",
    value: "capstoneprototype.online",
    description:
      "Connect a custom domain when the domain feature is available for your plan.",
  },
  {
    title: "BerryPanel account",
    value: "capstoneprototype.online",
    description:
      "Use this domain to sign in, manage sites, and review deployment status.",
  },
];

export const safetyNotes = [
  "The site terminal supports common Laravel deployment and maintenance commands for the selected site.",
  "Terminal commands apply only to the selected site.",
  "The current plan includes 25 GB of storage. The dashboard shows usage and file counts.",
  "Deleting a site removes deployed files and the BerryPanel site record. Database deletion is managed separately unless stated during deletion.",
  "Long-running workers, queues, and realtime services require a managed process feature before they can run continuously.",
];
