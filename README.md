# PersonalWebsite

Standalone static refresh for Philippe Beaudette's executive profile site.

Open `index.html` directly in a browser to preview. The site is plain HTML and CSS, so it can be deployed to any static host.

## Structure

- `index.html` - single-page executive profile
- `Calendar/index.html` - matching page for an embedded Google Calendar iframe
- `styles.css` - dark navy/deep green visual system

## Version

Current site version: `1.6.0` (minor increment for this deployment).

## Notes

The copy intentionally uses conservative wording around public background. Replace the placeholder contact address or writing links with final destinations before publishing.

## Calendar embed

`Calendar/index.html` embeds the Google Appointment Schedule URL and includes a direct fallback link. Google may block third-party iframe rendering for some appointment pages with `x-frame-options: SAMEORIGIN`; the fallback link covers that case.


## CMS editing workflow

A Decap CMS admin interface is available at `/admin/`.

1. Update `admin/config.yml` with your GitHub repo owner/name and default branch.
2. Configure authentication for your host (for Netlify, enable Identity + Git Gateway).
3. Edit homepage content from CMS; changes are saved to `content/site.json`.
4. `app.js` loads `content/site.json` and injects values into the page at runtime.


## Authentication status

The `/admin/` panel is **not automatically protected by this repo alone**. Authentication is enforced by your hosting provider integration.

For Netlify + Decap CMS:
1. Enable **Netlify Identity**.
2. Enable **Git Gateway**.
3. Invite only approved users (Identity > Invite users).
4. Optionally require registration to be invite-only.

With this setup, only authenticated invited users can access CMS write actions.
