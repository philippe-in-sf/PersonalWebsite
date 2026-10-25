# Security hardening

Public-repo guidance for keeping `beaudette.me` locked down. Host-specific values (IPs, SSH users, absolute paths) belong in a **private** runbook only.

## Deploy allow-list

Copy only:

- `index.html`, `styles.css`, `app.js`, `.htaccess`
- `assets/`, `content/`, `calendar/`, `writing/`, `admin/`

Never serve:

- `.git/`, `.github/`, `docs/`, `tests/`, `cms/`, `README.md`, `LICENSE`, local agent dirs

Example exclude-oriented rsync (adjust private source/dest in your runbook):

```bash
rsync -a --delete \
  --exclude '.git/' \
  --exclude '.github/' \
  --exclude '.tom/' \
  --exclude 'docs/' \
  --exclude 'tests/' \
  --exclude 'cms/' \
  --exclude 'README.md' \
  --exclude 'LICENSE' \
  --exclude '.gitignore' \
  ./ USER@HOST:WEB_ROOT/
```

## `.htaccess` (shipped)

The site root `.htaccess` sets:

- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Content-Security-Policy` (allows self, Sanity query API, Google Analytics, Google Calendar embed)
- `Options -Indexes`
- denies common sensitive path patterns if they are ever uploaded by mistake

Requires `mod_headers`, `mod_authz_core` (or equivalent), and `AllowOverride` that permits these directives.

**Production note:** the live Apache vhosts currently use `AllowOverride None`, so headers and path denials are enforced in the HTTPS virtual host (not via `.htaccess`). Keep `.htaccess` in-repo as the portable source of truth and mirror it into the vhost on deploy.

## Virtual host additions (private server)

Apply on the HTTPS vhost (and HTTP vhost only for ACME + redirect). Keep other sites’ configs untouched.

```apache
ServerTokens Prod
ServerSignature Off

# Prefer header module at vhost level if .htaccess overrides are restricted:
Header always unset X-Powered-By
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
Header always set Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://*.googletagmanager.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.api.sanity.io https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-src https://calendar.google.com https://calendar.app.google; upgrade-insecure-requests"

<Directory "DOCROOT">
  Options -Indexes -MultiViews
  AllowOverride FileInfo AuthConfig Indexes Limit
  Require all granted
</Directory>

# Block VCS and tooling if present under the docroot
RedirectMatch 404 /\.git
RedirectMatch 404 (?i)/\.(?:env|ssh|htpasswd)(?:$|/)
```

Replace `DOCROOT` with the private absolute web root. After edits: `apachectl configtest` and reload Apache.

## Sanity CMS

- Public read of the homepage dataset is intentional; **write access is the trust boundary**.
- Enforce MFA on the Sanity organization, least-privilege roles, and CORS only for `https://beaudette.me`, `https://www.beaudette.me`, and local preview origins you actually use.
- Never commit Sanity write tokens or Studio service-account keys.

## Verification checklist

```bash
curl -sI https://beaudette.me/ | grep -iE 'strict-transport|content-security|x-frame|x-content|referrer-policy|permissions-policy|server:'
curl -sI https://beaudette.me/.git/HEAD          # expect 404
curl -sI https://beaudette.me/docs/deployment-audit.md  # expect 404
curl -sI http://beaudette.me/                    # expect redirect to https
```

Confirm the homepage, `/calendar/`, and Sanity-driven copy still load after CSP changes.
