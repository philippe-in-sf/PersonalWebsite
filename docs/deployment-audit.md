# Deployment Audit

## 2026-05-16 - 1.9.0 / deploy 3.2

- Inlined the Sanity CMS loader in `index.html` so content updates do not depend on external JavaScript asset caching.
- Set `app.js` to use the configured Sanity project by default as a fallback/reference file.

## 2026-05-16 - 1.8.0 / deploy 3.1

- Connected the site to Sanity CMS using project `deoliu90` and dataset `production`.
- Kept `content/site.json` as the static fallback if Sanity is unavailable.
- Replaced the old Decap admin route with a Sanity handoff page.
- Added Sanity homepage schema and seed content for CMS setup.
