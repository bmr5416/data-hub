# Supabase Configuration Reference

Complete reference for `supabase/config.toml` - the local development configuration file.

## File Location

```
supabase/
├── config.toml        # Configuration file
├── migrations/        # Database migrations
└── seed.sql          # Seed data (optional)
```

## Full Template

```toml
# supabase/config.toml

# Project identifier (from supabase link)
project_id = "your-project-ref"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[api.tls]
enabled = false

[db]
port = 54322
shadow_port = 54320
major_version = 15

[db.pooler]
enabled = false
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100

[realtime]
enabled = true
ip_version = "IPv4"
max_header_length = 4096

[studio]
enabled = true
port = 54323
api_url = "http://127.0.0.1"

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[storage]
enabled = true
file_size_limit = "50MiB"

[storage.image_transformation]
enabled = true

[auth]
enabled = true
site_url = "http://127.0.0.1:3000"
additional_redirect_urls = ["https://127.0.0.1:3000"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = true
enable_anonymous_sign_ins = false
enable_manual_linking = false

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false
secure_password_change = true
max_frequency = "1s"

[auth.email.template.invite]
subject = "You have been invited"
content_path = "./supabase/templates/invite.html"

[auth.email.template.confirmation]
subject = "Confirm your email"
content_path = "./supabase/templates/confirm.html"

[auth.email.template.recovery]
subject = "Reset your password"
content_path = "./supabase/templates/recovery.html"

[auth.email.template.email_change]
subject = "Confirm email change"
content_path = "./supabase/templates/email_change.html"

[auth.email.template.magic_link]
subject = "Your magic link"
content_path = "./supabase/templates/magic_link.html"

[auth.sms]
enable_signup = true
enable_confirmations = false
max_frequency = "5s"

[auth.sms.twilio]
enabled = false
account_sid = ""
message_service_sid = ""
auth_token = "env(SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN)"

[auth.external.apple]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_APPLE_SECRET)"
redirect_uri = ""

[auth.external.azure]
enabled = false
url = ""
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_AZURE_SECRET)"
redirect_uri = ""

[auth.external.google]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
redirect_uri = ""
skip_nonce_check = false

[auth.external.github]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET)"
redirect_uri = ""

[auth.external.facebook]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_FACEBOOK_SECRET)"
redirect_uri = ""

[auth.external.twitter]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_TWITTER_SECRET)"
redirect_uri = ""

[auth.external.discord]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_DISCORD_SECRET)"
redirect_uri = ""

[auth.external.spotify]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_SPOTIFY_SECRET)"
redirect_uri = ""

[auth.external.slack]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_SLACK_SECRET)"
redirect_uri = ""

[auth.external.twitch]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_TWITCH_SECRET)"
redirect_uri = ""

[auth.external.linkedin]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_LINKEDIN_SECRET)"
redirect_uri = ""

[auth.external.notion]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_NOTION_SECRET)"
redirect_uri = ""

[auth.third_party.firebase]
enabled = false
project_id = ""

[auth.third_party.auth0]
enabled = false
tenant = ""
tenant_region = ""

[auth.third_party.aws_cognito]
enabled = false
user_pool_id = ""
user_pool_region = ""

[edge_runtime]
enabled = true
policy = "per_worker"
inspector_port = 8083

[analytics]
enabled = false
port = 54327
backend = "postgres"

# Named Edge Functions
[functions.my-function]
enabled = true
verify_jwt = true
import_map = "./supabase/functions/import_map.json"

# Database branches (experimental)
[remotes.production]
project_ref = "production-project-id"
access_token = "env(SUPABASE_ACCESS_TOKEN)"

[remotes.staging]
project_ref = "staging-project-id"
access_token = "env(SUPABASE_ACCESS_TOKEN)"

# Seed configuration
[db.seed]
enabled = true
sql_paths = ["./supabase/seed.sql", "./supabase/seeds/*.sql"]
```

## Section Reference

### [api]

API gateway configuration.

```toml
[api]
enabled = true           # Enable API (required)
port = 54321            # API port
schemas = ["public", "graphql_public"]  # Exposed schemas
extra_search_path = ["public", "extensions"]
max_rows = 1000         # Max rows per request (safety limit)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | bool | true | Enable PostgREST API |
| `port` | int | 54321 | API port |
| `schemas` | array | ["public", "graphql_public"] | Schemas exposed via API |
| `extra_search_path` | array | ["public", "extensions"] | Additional search path |
| `max_rows` | int | 1000 | Max rows per request |

### [db]

Database configuration.

```toml
[db]
port = 54322            # PostgreSQL port
shadow_port = 54320     # Shadow database port (for diffing)
major_version = 15      # PostgreSQL version
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | int | 54322 | Postgres port |
| `shadow_port` | int | 54320 | Shadow DB for migrations |
| `major_version` | int | 15 | PostgreSQL major version |

### [db.pooler]

Connection pooler (PgBouncer) configuration.

```toml
[db.pooler]
enabled = false         # Enable connection pooling
port = 54329           # Pooler port
pool_mode = "transaction"  # transaction, session, statement
default_pool_size = 20
max_client_conn = 100
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | bool | false | Enable PgBouncer |
| `port` | int | 54329 | Pooler port |
| `pool_mode` | string | "transaction" | Pooling mode |
| `default_pool_size` | int | 20 | Connections per pool |
| `max_client_conn` | int | 100 | Max client connections |

### [auth]

Authentication configuration.

```toml
[auth]
enabled = true
site_url = "http://127.0.0.1:3000"
additional_redirect_urls = ["https://127.0.0.1:3000"]
jwt_expiry = 3600       # 1 hour
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10  # seconds
enable_signup = true
enable_anonymous_sign_ins = false
enable_manual_linking = false
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | bool | true | Enable auth |
| `site_url` | string | - | Base URL for redirects |
| `additional_redirect_urls` | array | [] | Allowed OAuth redirects |
| `jwt_expiry` | int | 3600 | Access token TTL (seconds) |
| `enable_refresh_token_rotation` | bool | true | Rotate refresh tokens |
| `refresh_token_reuse_interval` | int | 10 | Grace period (seconds) |
| `enable_signup` | bool | true | Allow new signups |
| `enable_anonymous_sign_ins` | bool | false | Allow anon sessions |
| `enable_manual_linking` | bool | false | Allow identity linking |

### [auth.email]

Email authentication settings.

```toml
[auth.email]
enable_signup = true
double_confirm_changes = true   # Require confirm for email change
enable_confirmations = false    # Require email confirmation
secure_password_change = true   # Require current password
max_frequency = "1s"           # Rate limit between emails
```

### [auth.email.template.*]

Custom email templates.

```toml
[auth.email.template.invite]
subject = "You have been invited"
content_path = "./supabase/templates/invite.html"
```

**Available templates:**
- `invite` - User invitation
- `confirmation` - Email confirmation
- `recovery` - Password reset
- `email_change` - Email change confirmation
- `magic_link` - Magic link login

**Template variables:**
```html
{{ .ConfirmationURL }}  <!-- Confirmation link -->
{{ .Token }}            <!-- Token value -->
{{ .TokenHash }}        <!-- Token hash -->
{{ .SiteURL }}          <!-- Site URL -->
{{ .RedirectTo }}       <!-- Redirect URL -->
```

### [auth.external.*]

OAuth provider configuration.

```toml
[auth.external.google]
enabled = true
client_id = "your-client-id.apps.googleusercontent.com"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
redirect_uri = "http://127.0.0.1:54321/auth/v1/callback"
skip_nonce_check = false
```

**Supported providers:**
- apple, azure, bitbucket, discord, facebook
- figma, github, gitlab, google, kakao
- keycloak, linkedin, notion, slack, spotify
- twitch, twitter, workos, zoom

### [storage]

Storage configuration.

```toml
[storage]
enabled = true
file_size_limit = "50MiB"  # Max upload size

[storage.image_transformation]
enabled = true  # Enable on-the-fly image transforms
```

### [studio]

Supabase Studio (local dashboard).

```toml
[studio]
enabled = true
port = 54323
api_url = "http://127.0.0.1"
```

### [inbucket]

Local email testing server.

```toml
[inbucket]
enabled = true
port = 54324      # Web UI
smtp_port = 54325 # SMTP
pop3_port = 54326 # POP3
```

Access at: http://localhost:54324

### [realtime]

Realtime subscriptions.

```toml
[realtime]
enabled = true
ip_version = "IPv4"
max_header_length = 4096
```

### [edge_runtime]

Edge Functions runtime.

```toml
[edge_runtime]
enabled = true
policy = "per_worker"   # per_worker or oneshot
inspector_port = 8083   # Debugger port
```

### [functions.*]

Individual Edge Function configuration.

```toml
[functions.my-function]
enabled = true
verify_jwt = true       # Require authentication
import_map = "./supabase/functions/import_map.json"
```

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | bool | true | Enable function |
| `verify_jwt` | bool | true | Require valid JWT |
| `import_map` | string | - | Path to import map |

### [analytics]

Analytics/logging configuration.

```toml
[analytics]
enabled = false
port = 54327
backend = "postgres"  # postgres or bigquery
```

### [remotes.*]

Database branch remotes (experimental).

```toml
[remotes.production]
project_ref = "your-production-project-id"
access_token = "env(SUPABASE_ACCESS_TOKEN)"

[remotes.staging]
project_ref = "your-staging-project-id"
access_token = "env(SUPABASE_ACCESS_TOKEN)"
```

### [db.seed]

Seed data configuration.

```toml
[db.seed]
enabled = true
sql_paths = [
  "./supabase/seed.sql",
  "./supabase/seeds/*.sql"
]
```

## Environment Variables

Use `env(VAR_NAME)` syntax for secrets:

```toml
[auth.external.google]
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
```

This reads from system environment at runtime.

## Common Configurations

### Development (Default)

```toml
[auth]
site_url = "http://127.0.0.1:3000"
enable_signup = true

[auth.email]
enable_confirmations = false  # Skip email confirm locally
```

### Production-like Testing

```toml
[auth]
site_url = "http://127.0.0.1:3000"
enable_signup = false  # Invite-only

[auth.email]
enable_confirmations = true
double_confirm_changes = true
secure_password_change = true
```

### With Google OAuth

```toml
[auth]
site_url = "http://127.0.0.1:3000"
additional_redirect_urls = ["http://127.0.0.1:3000/auth/callback"]

[auth.external.google]
enabled = true
client_id = "your-client-id.apps.googleusercontent.com"
secret = "env(GOOGLE_CLIENT_SECRET)"
redirect_uri = "http://127.0.0.1:54321/auth/v1/callback"
```

### Larger File Uploads

```toml
[storage]
file_size_limit = "100MiB"  # Increase from 50MiB default
```

### Faster JWT Expiry (Testing)

```toml
[auth]
jwt_expiry = 300  # 5 minutes instead of 1 hour
```

### Disable Unused Services

```toml
[realtime]
enabled = false  # If not using realtime

[analytics]
enabled = false  # If not using analytics

[inbucket]
enabled = false  # If using real email provider
```

## Validation

After modifying config.toml:

```bash
# Restart to apply changes
supabase stop
supabase start

# Or just restart specific service
supabase stop --no-backup
supabase start
```

## Syncing with Remote

Local config.toml doesn't sync with remote projects. Configure remote settings via:
1. Supabase Dashboard
2. Management API
3. `supabase link` + environment variables

## Troubleshooting

### Port Conflicts

```toml
# Change conflicting ports
[api]
port = 54331  # Instead of 54321

[db]
port = 54332  # Instead of 54322

[studio]
port = 54333  # Instead of 54323
```

### Auth Not Working

1. Check `site_url` matches your frontend
2. Verify `additional_redirect_urls` includes all OAuth callbacks
3. Ensure OAuth secrets are set in environment

### Storage Upload Failing

```toml
[storage]
file_size_limit = "100MiB"  # Increase limit
```

### Edge Functions Not Found

```toml
[edge_runtime]
enabled = true

[functions.my-function]
enabled = true
verify_jwt = false  # For testing
```
