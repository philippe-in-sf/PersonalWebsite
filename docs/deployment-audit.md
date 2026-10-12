# Deployment Audit

## 2026-10-11 - 1.12.0 / SVG display dimensions

- Set actual display dimensions on signature and initials images so cached or unavailable CSS cannot display them at their 1,920-pixel source width.
- Limited the profile signature to 180 pixels with a responsive maximum width; refreshed asset version queries.

## 2026-10-11 - 1.11.0 / cache refresh

- Versioned public-page stylesheet and SVG artwork URLs to bypass cached pre-branding assets.
- Added HTML revalidation (`Cache-Control: no-cache`) to the beaudette.me Apache HTTPS virtual host.
- Verified the live site renders the initials and profile signature; no changes were made to the other hosted sites.

## 2026-10-11 - 1.10.0 / server migration

- Migrated `beaudette.me` and `www.beaudette.me` from `66.29.132.30` to `162.0.213.176` (`server1.philippe-tasks.net`, SSH user `philippe`). Namecheap manages the DNS; both A records now point to the new server. Nameservers and MX records were preserved.
- Deployed branding release `df12cbb352b96e61b38110cfe79ed914e6b1eb24` to `/var/www/beaudette.me`. Public files include `index.html`, `styles.css`, `app.js`, `content/`, `calendar/`, `writing/`, `admin/`, and `assets/`. Git metadata and CMS development files are excluded from the web root.
- Added separate Apache virtual hosts in `/etc/apache2/sites-available/zz-beaudette.me.conf` and `zz-beaudette.me-le-ssl.conf`. Existing default hosts and proxy configurations for `philippe-tasks.net` and `followthrough.dev` were preserved. Apache was reloaded without restarting the app on port 3000.
- HTTP redirects to HTTPS except for `/.well-known/acme-challenge/`. The legacy `/Calendar/` path redirects to `/calendar/`. Directory listings are disabled.
- Issued a Let's Encrypt certificate covering both website domains, stored at `/etc/letsencrypt/live/beaudette.me/`. Initial DNS verification was followed by a successful simulated renewal using Certbot's webroot authenticator. The active `certbot.timer` handles renewals; `/etc/letsencrypt/renewal-hooks/deploy/beaudette-apache-reload.sh` checks Apache's configuration and reloads it after this certificate renews.
- Verified public HTTPS responses connect to `162.0.213.176` with valid TLS for both names. Homepage, writing, calendar, signature, favicon, and fallback content matched the deployed release. Both existing apps continued returning HTTPS 200 responses; their Apache configuration hashes remained unchanged.

### Operations after migration

- The root `.cpanel.yml` is the legacy hosting deployment configuration. It does not deploy to the new server. Future website releases must be uploaded over SSH to `/var/www/beaudette.me`, using only the public files listed above. Keep Git metadata and development/configuration files outside the served directory.
- To verify certificate renewal: `ssh philippe@philippe-tasks.net 'sudo certbot renew --cert-name beaudette.me --dry-run --run-deploy-hooks'`.
- Apache access/error logs are `/var/log/apache2/beaudette-access.log` and `/var/log/apache2/beaudette-error.log`.
- Keep the previous hosting running during DNS propagation. If rollback is necessary while it remains available, restore both Namecheap A records (`@` and `www`) to `66.29.132.30`; do not change email records or the other hosted domains.
- The temporary TXT records at `_acme-challenge` and `_acme-challenge.www` can be removed after cutover; automatic renewal now uses HTTP verification.

## 2026-05-16 - 1.9.0 / deploy 3.2

- Inlined the Sanity CMS loader in `index.html` so content updates do not depend on external JavaScript asset caching.
- Set `app.js` to use the configured Sanity project by default as a fallback/reference file.

## 2026-05-16 - 1.8.0 / deploy 3.1

- Connected the site to Sanity CMS using project `deoliu90` and dataset `production`.
- Kept `content/site.json` as the static fallback if Sanity is unavailable.
- Replaced the old Decap admin route with a Sanity handoff page.
- Added Sanity homepage schema and seed content for CMS setup.
