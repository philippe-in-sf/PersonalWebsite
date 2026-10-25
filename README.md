# PersonalWebsite

Standalone static refresh for Philippe Beaudette's executive profile site.

Open `index.html` directly in a browser to preview. The site is plain HTML and CSS, so it can be deployed to any static host.

## Structure

- `index.html` - single-page executive profile
- `calendar/index.html` - matching page for an embedded Google Calendar appointment schedule
- `.htaccess` - redirects plus browser security headers (HSTS, CSP, etc.)
- `styles.css` - dark navy/deep green visual system
- `content/site.json` - checked-in fallback content
- `content/cms.js` - shared CMS connection, fallback loading, and URL validation
- `app.js` - shared homepage and writing-page rendering
- `cms/` - Sanity schema and seed content (not deployed to the public web root)
- `tests/` - dependency-free site regression tests
- `docs/security-hardening.md` - deploy allow-list and Apache hardening guidance

## Version

Current site version: `1.12.0` (explicit display dimensions for brand artwork).

## Notes

The copy intentionally uses conservative wording around public background. When no published articles are configured, the site shows an explicit empty state rather than sample links.

## Testing

Run the dependency-free regression suite with:

```bash
node --test
```

The same command runs for pushes and pull requests in GitHub Actions.

## Hosting

The live site is static files on Apache with separate HTTPS virtual hosts for `beaudette.me` and `www.beaudette.me`. TLS renews automatically via Let's Encrypt. Deploy **public site files only**; keep Git metadata, tests, CMS studio sources, and ops docs out of the web root.

Hostnames, IPs, SSH users, and absolute server paths are intentionally omitted from this public repository—keep them in a private runbook.

See [the deployment audit](docs/deployment-audit.md) for release history and [security hardening](docs/security-hardening.md) for headers, CSP, and deploy allow-list guidance. The legacy cPanel deploy file (`.cpanel.yml`) has been removed.

## Calendar embed

`calendar/index.html` embeds the Google Appointment Schedule URL with Google's appointment-schedule iframe path and includes a direct fallback link. The Apache redirect keeps the legacy capitalized `/Calendar/` URL pointed at `/calendar/`.


## CMS editing workflow

The site is wired for Sanity as the hosted CMS. Sanity handles editor authentication, including Google login if enabled for the Sanity organization/project. The public site stays static and reads content from Sanity's Content Lake. Treat Sanity **write** access as the primary trust boundary: enable org MFA, least-privilege roles, and never commit write tokens.

1. Create a Sanity project and dataset, usually `production`.
2. Add `cms/sanity-homepage-schema.js` to the Studio schema types.
3. Import `cms/homepage.seed.ndjson`, or create a `homepage` document with the `_id` `homepage`.
4. Update the single CMS configuration in `content/cms.js` with the Sanity project ID and dataset.
5. Restrict Sanity CORS to `https://beaudette.me`, `https://www.beaudette.me`, and only the local preview origins you use.

If Sanity is not configured or the request fails, the shared loader falls back to `content/site.json`.

## Sanity content model

The homepage document uses this shape:

- `siteName`
- `hero`: `sectionLabel`, `title`, `dek`, `intro`
- `profile`: `sectionLabel`, `title`, `body1`, `body2`
- `now`: `sectionLabel`, `title`, `body`
- `writing`: `sectionLabel`, `title`, `linkText`
- `contact`: `sectionLabel`, `title`, `body`, `email`, `linkedinUrl`

The old `/admin/` route now points editors toward Sanity Studio instead of loading Decap CMS.

## Brand artwork

`assets/brand/initials.svg` and `assets/brand/signature.svg` use Philippe’s supplied vector artwork, recolored to the site’s gold (`#d2bd8a`) without changing the paths. The initials appear in the public-page headers and homepage profile card; the full signature signs off the profile text. `assets/brand/favicon.svg` places the same initials on a navy tile and is linked from every page.

The header’s `brand-name` ID belongs to the text span so CMS updates preserve the initials artwork. Keep the full name as text in the main heading for accessibility and search.

Stylesheet and brand artwork URLs include a version query to prevent older cached assets from hiding design updates. Increment that query when those assets change. The new server revalidates HTML with `Cache-Control: no-cache`.
