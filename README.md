# PersonalWebsite

Standalone static refresh for Philippe Beaudette's executive profile site.

Open `index.html` directly in a browser to preview. The site is plain HTML and CSS, so it can be deployed to any static host.

## Structure

- `index.html` - single-page executive profile
- `Calendar/index.html` - matching page for an embedded Google Calendar iframe
- `styles.css` - dark navy/deep green visual system

## Notes

The copy intentionally uses conservative wording around public background. Replace the placeholder contact address or writing links with final destinations before publishing.

## Calendar embed

`Calendar/index.html` embeds the Google Appointment Schedule URL and includes a direct fallback link. Google may block third-party iframe rendering for some appointment pages with `x-frame-options: SAMEORIGIN`; the fallback link covers that case.
