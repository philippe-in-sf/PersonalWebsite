# PersonalWebsite

Standalone static refresh for Philippe Beaudette's executive profile site.

Open `index.html` directly in a browser to preview. The site is plain HTML and CSS, so it can be deployed to any static host.

## Structure

- `index.html` - single-page executive profile
- `Calendar/index.html` - matching page for an embedded Google Calendar iframe
- `styles.css` - dark navy/deep green visual system

## Version

Current site version: `1.7.0` (minor increment for this deployment).

## Notes

The copy intentionally uses conservative wording around public background. Replace the placeholder contact address or writing links with final destinations before publishing.

## Calendar embed

`Calendar/index.html` embeds the Google Appointment Schedule URL and includes a direct fallback link. Google may block third-party iframe rendering for some appointment pages with `x-frame-options: SAMEORIGIN`; the fallback link covers that case.


## CMS editing workflow

A Decap CMS admin interface is available at `/admin/`.

1. Update `admin/config.yml` with your GitHub repo owner/name and default branch.
2. Configure Decap GitHub OAuth (current default uses `https://auth.decapbridge.com`).
3. Edit homepage content from CMS; changes are saved to `content/site.json`.
4. `app.js` loads `content/site.json` and injects values into the page at runtime.


## Authentication status

The `/admin/` panel uses Decap CMS with GitHub authentication (no Netlify dependency).

Current setup:
1. Decap backend is `github` for `philippe-in-sf/PersonalWebsite`.
2. OAuth flow is handled by `https://auth.decapbridge.com` (`base_url` in `admin/config.yml`).
3. Access is controlled by GitHub permissions to the repository.

If you prefer fully self-hosted auth, replace `base_url` with your own Decap OAuth proxy endpoint.
