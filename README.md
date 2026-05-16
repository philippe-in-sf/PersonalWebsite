# PersonalWebsite

Standalone static refresh for Philippe Beaudette's executive profile site.

Open `index.html` directly in a browser to preview. The site is plain HTML and CSS, so it can be deployed to any static host.

## Structure

- `index.html` - single-page executive profile
- `calendar/index.html` - matching page for an embedded Google Calendar appointment schedule
- `.htaccess` - redirect from the legacy capitalized calendar URL
- `styles.css` - dark navy/deep green visual system
- `content/site.json` - checked-in fallback content
- `content/cms.js` - hosted CMS connection settings
- `cms/` - Sanity schema and seed content

## Version

Current site version: `1.8.0` (minor increment for the Sanity CMS deployment).

## Notes

The copy intentionally uses conservative wording around public background. Replace the placeholder contact address or writing links with final destinations before publishing.

## Calendar embed

`calendar/index.html` embeds the Google Appointment Schedule URL with Google's appointment-schedule iframe path and includes a direct fallback link. The Apache redirect keeps the legacy capitalized `/Calendar/` URL pointed at `/calendar/`.


## CMS editing workflow

The site is wired for Sanity as the hosted CMS. Sanity handles editor authentication, including Google login if enabled for the Sanity organization/project. The public site stays static and reads content from Sanity's Content Lake.

1. Create a Sanity project and dataset, usually `production`.
2. Add `cms/sanity-homepage-schema.js` to the Studio schema types.
3. Import `cms/homepage.seed.ndjson`, or create a `homepage` document with the `_id` `homepage`.
4. Update `content/cms.js` with the Sanity project ID and dataset.
5. Add `https://beaudette.me` and local preview origins to the Sanity CORS settings.

If Sanity is not configured or the request fails, `app.js` falls back to `content/site.json`.

## Sanity content model

The homepage document uses this shape:

- `siteName`
- `hero`: `sectionLabel`, `title`, `dek`, `intro`
- `profile`: `sectionLabel`, `title`, `body1`, `body2`
- `now`: `sectionLabel`, `title`, `body`
- `writing`: `sectionLabel`, `title`, `linkText`
- `contact`: `sectionLabel`, `title`, `body`, `email`, `linkedinUrl`

The old `/admin/` route now points editors toward Sanity Studio instead of loading Decap CMS.
