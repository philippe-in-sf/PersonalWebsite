# Deployment Audit

Operational notes for `beaudette.me`. **Do not publish hostnames, IP addresses, SSH usernames, filesystem paths, certificate paths, or co-hosted service details in this public repository.** Keep that inventory in a private runbook.

## 2026-10-25 - security remediation

- Redacted infrastructure identifiers from public docs after a security review.
- Added browser security headers and a Content-Security-Policy in `.htaccess`.
- Retired the legacy cPanel full-tree rsync deploy config (`.cpanel.yml` removed).
- Documented Apache vhost hardening in `docs/security-hardening.md`.
- Tightened the calendar iframe referrer policy.

## 2026-10-11 - 1.12.0 / SVG display dimensions

- Set actual display dimensions on signature and initials images so cached or unavailable CSS cannot display them at their source width.
- Limited the profile signature to 180 pixels with a responsive maximum width; refreshed asset version queries.

## 2026-10-11 - 1.11.0 / cache refresh

- Versioned public-page stylesheet and SVG artwork URLs to bypass cached pre-branding assets.
- Added HTML revalidation (`Cache-Control: no-cache`) on the HTTPS virtual host for this site.
- Verified the live site renders the initials and profile signature.

## 2026-10-11 - 1.10.0 / server migration

- Migrated `beaudette.me` and `www.beaudette.me` to the current production host. DNS A records for the site names were updated; nameservers and MX records were preserved.
- Deployed the branding release to the site web root with **public files only**. Git metadata, tests, CMS development files, and ops docs stay outside the served directory.
- Added dedicated Apache virtual hosts for the site. Existing hosts and reverse proxies for other services on the same machine were left unchanged.
- HTTP redirects to HTTPS except for `/.well-known/acme-challenge/`. The legacy `/Calendar/` path redirects to `/calendar/`. Directory listings are disabled.
- Issued and auto-renews a Let's Encrypt certificate covering both website names. Renewal uses HTTP-01; a deploy hook reloads Apache after successful renewal of this certificate.
- Verified public HTTPS for both names and confirmed other hosted apps still responded normally.

### Operations after migration

- Deploy over SSH to the production web root using only public site files (`index.html`, `styles.css`, `app.js`, `content/`, `calendar/`, `writing/`, `admin/`, `assets/`, `.htaccess`). Keep `.git/`, `docs/`, `tests/`, `cms/`, `.github/`, and local tooling out of the web root.
- Prefer rsync with an explicit allow-list or `--exclude-from` rather than copying the entire repository tree. See `docs/security-hardening.md`.
- Certificate renewal dry-run and Apache config checks belong in the private runbook (not here).
- Access and error logs are the site-specific Apache logs on the production host.
- Rollback during DNS propagation: restore prior A records for `@` and `www` only; do not change email records or unrelated domains.
- Temporary ACME DNS TXT records can be removed after cutover when HTTP-01 renewal is confirmed.

## 2026-05-16 - 1.9.0 / deploy 3.2

- Inlined or centralized the Sanity CMS loader so content updates do not depend on stale external JavaScript caches alone.
- Set `app.js` / `content/cms.js` to use the configured Sanity project with local JSON fallback.

## 2026-05-16 - 1.8.0 / deploy 3.1

- Connected the site to Sanity CMS (public project id lives in `content/cms.js`; treat write access and Studio login as sensitive).
- Kept `content/site.json` as the static fallback if Sanity is unavailable.
- Replaced the old Decap admin route with a Sanity handoff page.
- Added Sanity homepage schema and seed content for CMS setup.
