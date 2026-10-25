# Security hardening

How `beaudette.me` is hardened, how to redeploy safely, and how to verify. Host-specific values (IPs, SSH users, absolute paths, backup locations) belong in a **private** runbook only—never recommit them here.

## Goals

1. Do not publish infrastructure recon data in this public repository.
2. Serve only public site files from the web root.
3. Send modern browser security headers on every HTML response.
4. Keep CMS **write** access tightly controlled (public read is intentional).
5. Make deploys repeatable and easy to verify.

## Architecture (trust boundaries)

| Layer | What it does | Trust notes |
|---|---|---|
| Static files on Apache | HTML/CSS/JS/assets | No app server in this repo |
| HTTPS vhost | Redirects, headers, path denials | Production uses `AllowOverride None` |
| `.htaccess` in git | Portable copy of redirects/headers/denials | Mirrored into the vhost; not relied on alone in production |
| Sanity Content Lake | Homepage copy over public query API | Anyone with project **write** can change public content |
| Google Analytics / Calendar | Third-party script + iframe | Allowed explicitly in CSP |

Client rendering (`content/cms.js`, `app.js`) escapes text and allows only `http:`/`https:` links and plain emails. Do not weaken that without new tests.

## What shipped in the 2026-10-25 remediation

### Repository

- Redacted hosts, IPs, SSH users, filesystem/cert paths, and co-host details from public docs.
- Removed legacy `.cpanel.yml` (full-tree `rsync` into a web root).
- Expanded root `.htaccess`: HSTS, CSP, framing/nosniff/referrer/permissions headers, `-Indexes`, sensitive-path `404`s, HTML `Cache-Control: no-cache`.
- Calendar iframe: `referrerpolicy="strict-origin-when-cross-origin"` and `allow="clipboard-write"`.
- Regression tests for headers, path denials, doc leakage, and calendar attributes (`node --test`).

### Production server (private runbook holds exact host paths)

- HTTPS virtual host carries the same redirects, headers, CSP, and path denials (because `AllowOverride None`).
- `ServerTokens Prod` and `ServerSignature Off`.
- Public allow-list deploy only; `.well-known` preserved for ACME.
- Config and docroot backups taken before changes (retain until you are confident of the release).

Merged as PR #12 on `main`.

## Deploy allow-list

**Copy only:**

- `index.html`, `styles.css`, `app.js`, `.htaccess`
- `assets/`, `content/`, `calendar/`, `writing/`, `admin/`

**Never serve:**

- `.git/`, `.github/`, `docs/`, `tests/`, `cms/`
- `README.md`, `LICENSE`, `.gitignore`
- local agent dirs (for example `.tom/`)

### Preferred public-only stage (allow-list)

Run from the repo root. Replace `DEPLOY_HOST` and `WEB_ROOT` from the private runbook.

```bash
STAGE="$(mktemp -d)"
mkdir -p "$STAGE/site"
rsync -a \
  --include='.htaccess' \
  --include='index.html' \
  --include='styles.css' \
  --include='app.js' \
  --include='assets/***' \
  --include='content/***' \
  --include='calendar/***' \
  --include='writing/***' \
  --include='admin/***' \
  --exclude='*' \
  ./ "$STAGE/site/"

# Review the staged tree before shipping
find "$STAGE/site" -type f | sort

rsync -az -e ssh "$STAGE/site/" "$DEPLOY_HOST:~/beaudette-deploy/"
ssh "$DEPLOY_HOST" 'sudo rsync -a --exclude ".well-known" ~/beaudette-deploy/ WEB_ROOT/ && sudo chown -R root:root WEB_ROOT && rm -rf ~/beaudette-deploy'
rm -rf "$STAGE"
```

After any change to headers or redirects, mirror `.htaccess` policy into the HTTPS vhost (production does not honor `.htaccess` while `AllowOverride None` remains set), then:

```bash
sudo apache2ctl configtest
sudo systemctl reload apache2
```

`ServerTokens` changes may need a graceful restart, not only a reload.

## `.htaccess` (portable source of truth)

Shipped controls:

- Redirects: `/Calendar` → `/calendar/`; temporary `/writing` → `/`
- `Options -Indexes`
- `404` for `.git`, env/ssh/htpasswd-style paths, `docs|tests|cms|.github`, and common repo metadata filenames
- Headers: `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`
- HTML `Cache-Control: no-cache`

Requires `mod_headers` (and redirect support). CSP allows:

- `'self'` for default content
- Sanity: `https://*.api.sanity.io`
- Google Analytics / Tag Manager
- Google Calendar embed frames: `https://calendar.google.com`, `https://calendar.app.google`
- `'unsafe-inline'` for the small gtag bootstrap and admin page styles

If you add a new third-party script, font, frame, or API host, update **both** `.htaccess` and the live vhost CSP, then extend tests.

## HTTPS virtual host pattern

Keep other sites on the host untouched. Conceptually the beaudette HTTPS vhost should include:

```apache
ServerName beaudette.me
ServerAlias www.beaudette.me
DocumentRoot "DOCROOT"

<Directory "DOCROOT">
    Options -Indexes -MultiViews
    AllowOverride None
    Require all granted
    DirectoryIndex index.html
</Directory>

RedirectMatch 301 ^/Calendar/?$ /calendar/
RedirectMatch 302 ^/writing(?:/index\.html|/)?$ /

RedirectMatch 404 /\.git
RedirectMatch 404 (?i)/\.(?:env|ssh|htpasswd)(?:$|/)
RedirectMatch 404 (?i)^/(?:docs|tests|cms|\.github)(?:/|$)
RedirectMatch 404 (?i)^/(?:README\.md|LICENSE|\.gitignore|\.cpanel\.yml)$

Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
Header always set Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://*.googletagmanager.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.api.sanity.io https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-src https://calendar.google.com https://calendar.app.google; upgrade-insecure-requests"
Header always unset X-Powered-By

<FilesMatch "\.html$">
    Header set Cache-Control "no-cache"
</FilesMatch>
```

HTTP vhost: ACME exception + redirect to HTTPS only.

Global Apache identity reduction:

```apache
ServerTokens Prod
ServerSignature Off
```

## Sanity CMS

- Public dataset reads power the homepage; that is expected.
- **Write access is the high-impact boundary** (defacement, phishing links). Use org MFA, least-privilege roles, no committed write tokens.
- CORS: `https://beaudette.me`, `https://www.beaudette.me`, plus only local preview origins you use.
- Keep `content/site.json` in sync enough to be a sensible offline fallback.

## Local quality gates

```bash
node --test
```

CI runs the same suite on push and pull request. Tests assert security headers in `.htaccess`, absence of infrastructure identifiers in public docs, calendar iframe hardening, and CMS URL/XSS defenses.

## Production verification checklist

```bash
# Headers
curl -sI https://beaudette.me/ | grep -iE 'strict-transport|content-security|x-frame|x-content|referrer-policy|permissions-policy|^server:'

# Core pages
curl -s -o /dev/null -w '%{http_code}\n' https://beaudette.me/
curl -s -o /dev/null -w '%{http_code}\n' https://beaudette.me/calendar/
curl -s -o /dev/null -w '%{http_code}\n' https://www.beaudette.me/

# Calendar hardening marker
curl -s https://beaudette.me/calendar/ | grep -F 'referrerpolicy="strict-origin-when-cross-origin"'

# Redirects
curl -sI http://beaudette.me/ | grep -i '^location:'          # https
curl -sI https://beaudette.me/writing | grep -iE '^(HTTP/|location:)'
curl -sI https://beaudette.me/Calendar | grep -iE '^(HTTP/|location:)'

# Sensitive paths
for p in /.git/HEAD /.env /docs/deployment-audit.md /.cpanel.yml /tests/site.test.cjs /README.md; do
  printf '%s ' "$p"
  curl -s -o /dev/null -w '%{http_code}\n' "https://beaudette.me$p"
done
```

Also open `/` and `/calendar/` in a browser and confirm no CSP console blocks for GA, Sanity, or the calendar iframe.

## Rollback

1. **Docroot:** restore the timestamped tarball from the private backup location taken before deploy.
2. **Vhost / Apache security conf:** restore the `*.bak.*` copies taken beside the live config, `apache2ctl configtest`, reload or graceful restart.
3. **Git:** revert or redeploy the previous known-good `main` commit’s public allow-list.

Exact backup filenames and paths stay in the private runbook.

## Ongoing hygiene

- Prefer PRs for security-sensitive doc and header changes; keep CI green.
- Never reintroduce hostnames, IPs, SSH users, or absolute server paths into this public repo (tests guard common patterns).
- After deploy, delete home-directory staging folders (`~/beaudette-deploy`, etc.).
- Rotate or prune old server backups on your own schedule; do not commit backup contents.
- Git history may still contain pre-redaction text until history is rewritten or the repo is privatized—treat that as residual disclosure risk.
- Re-check Sanity members and CORS when people join or leave.

## Related docs

- [Deployment audit](deployment-audit.md) — dated release notes (redacted)
- [README](../README.md) — structure, testing, CMS workflow
