const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync, statSync, existsSync } = require('node:fs');
const { resolve, dirname, relative } = require('node:path');
const { execFileSync } = require('node:child_process');
const vm = require('node:vm');

const root = resolve(__dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const pages = ['index.html', 'writing/index.html'];
const publicPages = [...pages, 'calendar/index.html', 'admin/index.html'];
const fallback = JSON.parse(read('content/site.json'));
const ok = (data) => ({ ok: true, json: async () => data });

// Run the actual browser scripts with a small DOM surface, without dependencies
// or live CMS requests. Each page exposes only its own HTML element IDs.
function client(page, fetchImpl) {
  const elements = new Map([...read(page).matchAll(/\bid="([^"]+)"/g)].map(([, id]) => [id, {
    textContent: 'Static fallback',
    innerHTML: 'Static fallback',
    attributes: { href: 'https://beaudette.me/' },
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
  }]));
  const scriptUrl = new URL('../content/cms.js', 'https://beaudette.me/subsite/writing/');
  if (page === 'index.html') scriptUrl.href = 'https://beaudette.me/subsite/content/cms.js';
  const calls = [];
  const context = vm.createContext({
    window: {}, URL,
    document: { currentScript: { src: scriptUrl.href }, getElementById: (id) => elements.get(id) },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return fetchImpl(url, calls.length);
    },
    console: { error() {} },
  });
  vm.runInContext(read('content/cms.js'), context, { filename: 'content/cms.js' });
  return { context, elements, calls, api: context.window.SiteContent };
}

async function render(page, data) {
  const instance = client(page, () => ok({ result: data }));
  vm.runInContext(read('app.js'), instance.context, { filename: 'app.js' });
  await new Promise(setImmediate);
  return instance;
}

function files(directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.')) return [];
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

test('JavaScript files and inline scripts parse', () => {
  for (const path of files().filter((path) => /\.(?:js|cjs)$/.test(path))) {
    execFileSync(process.execPath, ['--check', path]);
  }
  for (const page of publicPages) {
    for (const [, attrs, source] of read(page).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (!/\bsrc=/.test(attrs)) new vm.Script(source, { filename: page });
    }
  }
});

test('fallback and Sanity seed agree and contain no invented articles', () => {
  const documents = read('cms/homepage.seed.ndjson').trim().split('\n').map(JSON.parse);
  assert.equal(documents.length, 1);
  const { _id, _type, ...content } = documents[0];
  assert.equal(_id, 'homepage');
  assert.equal(_type, 'homepage');
  assert.deepEqual(content, fallback);
  assert.deepEqual(fallback.writing.articles, []);
  for (const key of ['siteName', 'hero', 'profile', 'now', 'writing', 'contact']) assert.ok(fallback[key], key);
  for (const page of pages) assert.match(read(page), /No articles are listed yet/);
});

test('published content and scripts contain no placeholder domains', () => {
  for (const path of [...publicPages, 'app.js', 'content/cms.js', 'content/site.json', 'cms/homepage.seed.ndjson']) {
    assert.doesNotMatch(read(path), /\b(?:example\.(?:com|org|net)|your-project-id|localhost)\b/i, path);
  }
});

test('public navigation does not advertise Writing', () => {
  for (const page of publicPages) {
    for (const [nav] of read(page).matchAll(/<nav\b[^>]*>[\s\S]*?<\/nav>/g)) {
      assert.doesNotMatch(nav, /writing/i, page);
    }
  }
});

test('homepage Writing blocks stay hidden even when the CMS supplies articles', async () => {
  const html = read('index.html');
  for (const className of ['writing', 'writing-list-preview']) {
    assert.match(html, new RegExp(`<section class="${className}"[^>]* hidden style="display: none;"`));
  }
  const instance = await render('index.html', {
    writing: { title: 'Future writing', articles: [{ title: 'Future article', url: 'https://beaudette.me/' }] },
  });
  assert.match(instance.elements.get('writing-preview-list').innerHTML, /Future article/);
  assert.equal(instance.elements.get('writing-title').textContent, 'Future writing');
  // CMS rendering must not remove the hiding attributes or override their style.
  assert.doesNotMatch(read('app.js'), /\.hidden\s*=|\.style\b|(?:set|remove)Attribute\(['"](?:hidden|style)['"]/);
  assert.match(read('cms/sanity-homepage-schema.js'), /name: 'writing'/);
  assert.match(read('cms/sanity-homepage-schema.js'), /name: 'articles'/);
});

test('Writing redirects temporarily with noindex and immediate browser fallbacks', () => {
  const rule = read('.htaccess').match(/^RedirectMatch 302 (\S+) \/$/m);
  assert.ok(rule, 'temporary server redirect to homepage');
  const pattern = new RegExp(rule[1]);
  for (const path of ['/writing', '/writing/', '/writing/index.html']) assert.ok(pattern.test(path), path);
  for (const path of ['/', '/calendar/', '/writing-other', '/writing/indexXhtml']) assert.ok(!pattern.test(path), path);
  const html = read('writing/index.html');
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /<meta http-equiv="refresh" content="0; url=\/">/);
  const redirect = html.match(/<script>(window\.location\.replace\("\/"\);)<\/script>/);
  assert.ok(redirect);
  const destinations = [];
  vm.runInNewContext(redirect[1], { window: { location: { replace: (url) => destinations.push(url) } } });
  assert.deepEqual(destinations, ['/']);
  assert.match(html, /<main hidden style="display: none;">/);
  assert.match(html, /<a href="\/">Continue to homepage<\/a>/);
});

test('htaccess ships security headers, indexing off, and sensitive-path denials', () => {
  const htaccess = read('.htaccess');
  assert.match(htaccess, /^Options -Indexes$/m);
  for (const header of [
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Content-Security-Policy',
  ]) {
    assert.match(htaccess, new RegExp(`Header always set ${header} `));
  }
  assert.match(htaccess, /frame-src https:\/\/calendar\.google\.com/);
  assert.match(htaccess, /connect-src[^;]*https:\/\/\*\.api\.sanity\.io/);
  assert.ok(htaccess.split(/\n/).some((line) => line.startsWith('RedirectMatch 404') && line.includes('.git')));
  assert.ok(htaccess.split(/\n/).some((line) => line.includes('docs|tests|cms')));
  assert.equal(existsSync(resolve(root, '.cpanel.yml')), false);
});

test('public docs omit infrastructure identifiers and calendar embed hardens referrer', () => {
  const leakage = /\b(?:\d{1,3}(?:\.\d{1,3}){3}|philippe-tasks\.net|server1\.|\/var\/www\/|\/home\/|beauyqoz|letsencrypt\/live|ssh\s+\w+@)/i;
  for (const path of ['README.md', 'docs/deployment-audit.md', 'docs/security-hardening.md']) {
    assert.doesNotMatch(read(path), leakage, path);
  }
  assert.doesNotMatch(read('docs/security-hardening.md'), /USER@HOST:\/var\/www/);
  const calendar = read('calendar/index.html');
  assert.match(calendar, /<iframe\b[\s\S]*\breferrerpolicy="strict-origin-when-cross-origin"/);
  assert.match(calendar, /<iframe\b[\s\S]*\ballow="clipboard-write"/);
});

test('local HTML asset and navigation references resolve', () => {
  for (const page of publicPages) {
    for (const [, value] of read(page).matchAll(/\b(?:src|href)="([^"]+)"/g)) {
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) continue;
      const pathname = value.split(/[?#]/)[0];
      const target = resolve(value.startsWith('/') ? root : dirname(resolve(root, page)), pathname.replace(/^\//, ''));
      assert.ok(!relative(root, target).startsWith('..'), `${page}: ${value} escapes the site`);
      const info = statSync(target);
      if (info.isDirectory()) assert.ok(statSync(resolve(target, 'index.html')).isFile(), value);
      else assert.ok(info.isFile(), value);
    }
  }
});

test('content pages load shared scripts in order and keep CMS settings out of HTML and app.js', () => {
  for (const page of pages) {
    const prefix = page === 'index.html' ? '' : '../';
    const html = read(page);
    const scripts = [...html.matchAll(/<script\b([^>]*)>/g)].map(([, attrs]) => attrs);
    assert.ok(scripts.includes(` src="${prefix}content/cms.js" defer`));
    assert.ok(scripts.includes(` src="${prefix}app.js" defer`));
    assert.ok(html.indexOf(`src="${prefix}content/cms.js"`) < html.indexOf(`src="${prefix}app.js"`));
    assert.doesNotMatch(html, /SITE_CMS|CMS_CONFIG|api\.sanity\.io|fetch\(/);
  }
  assert.doesNotMatch(read('app.js'), /projectId|apiVersion|api\.sanity\.io|fetch\(/);
  assert.equal((read('content/cms.js').match(/projectId:/g) || []).length, 1);
});

test('content pages retain language, title, description, canonical, social and version metadata', () => {
  const version = read('index.html').match(/name="site-version" content="([^"]+)"/)[1];
  for (const page of pages) {
    const html = read(page);
    const canonical = 'https://beaudette.me/';
    assert.match(html, /<html lang="en">/);
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /name="description"\s+content="[^"]+"/);
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`));
    for (const key of ['title', 'description', 'type', 'url']) assert.match(html, new RegExp(`property="og:${key}"\\s+content="[^"]+"`));
    assert.ok(html.includes(`property="og:url" content="${canonical}"`));
    assert.ok(html.includes(`name="site-version" content="${version}"`));
    for (const [, assetVersion] of html.matchAll(/(?:\.css|\.svg)\?v=([^"\s]+)/g)) assert.equal(assetVersion, version);
  }
});

for (const page of pages) {
  test(`${page}: CMS success skips fallback and requests fresh content`, async () => {
    const instance = client(page, () => ok({ result: fallback }));
    const data = await instance.api.load();
    assert.equal(data, fallback);
    assert.equal(instance.calls.length, 1);
    const request = new URL(instance.calls[0].url);
    assert.equal(request.hostname, 'deoliu90.api.sanity.io');
    assert.match(request.searchParams.get('query'), /_id == "homepage"/);
    assert.equal(instance.calls[0].options.cache, 'no-store');
  });

  for (const failure of ['http', 'network', 'json', 'empty', 'invalid']) {
    test(`${page}: ${failure} CMS response uses the correct local fallback`, async () => {
      const instance = client(page, (url, call) => {
        if (call === 2) return ok(fallback);
        if (failure === 'http') return { ok: false };
        if (failure === 'network') throw new Error('offline');
        if (failure === 'json') return { ok: true, json: async () => { throw new SyntaxError('Invalid JSON'); } };
        return ok({ result: failure === 'empty' ? null : [] });
      });
      assert.equal(await instance.api.load(), fallback);
      assert.equal(instance.calls.length, 2);
      assert.equal(instance.calls[1].url, 'https://beaudette.me/subsite/content/site.json');
      assert.equal(instance.calls[1].options.cache, 'no-store');
    });
  }

  test(`${page}: total failure preserves static fallback`, async () => {
    const instance = client(page, () => { throw new Error('offline'); });
    vm.runInContext(read('app.js'), instance.context);
    await new Promise(setImmediate);
    const id = page === 'index.html' ? 'writing-preview-list' : 'writing-archive-list';
    assert.equal(instance.elements.get(id).innerHTML, 'Static fallback');
    assert.equal(instance.calls.length, 2);
  });

  test(`${page}: empty or malformed article lists replace stale cards with empty state`, async () => {
    const id = page === 'index.html' ? 'writing-preview-list' : 'writing-archive-list';
    for (const articles of [[], null, 'invalid', [null, false, []]]) {
      const instance = await render(page, { writing: { articles } });
      assert.match(instance.elements.get(id).innerHTML, /No articles are listed yet/);
      assert.doesNotMatch(instance.elements.get(id).innerHTML, /<a\b/);
    }
  });

  test(`${page}: renders page-specific article limits and escapes text and attributes`, async () => {
    const articles = Array.from({ length: 5 }, (_, index) => ({
      title: `<img onerror="alert(1)">${index}`, summary: '<script>bad</script>',
      publication: 'A & B', publishedOn: '2026-10-23', url: 'https://beaudette.me/?a=1&b="quoted"',
    }));
    const instance = await render(page, { siteName: 'New brand', writing: { title: 'New writing', articles } });
    const id = page === 'index.html' ? 'writing-preview-list' : 'writing-archive-list';
    const html = instance.elements.get(id).innerHTML;
    assert.equal((html.match(/<article\b/g) || []).length, page === 'index.html' ? 3 : 5);
    assert.match(html, /&lt;img onerror=&quot;alert\(1\)&quot;&gt;/);
    assert.match(html, /A &amp; B · 2026-10-23/);
    assert.doesNotMatch(html, /&amp;amp;|<script>|<img\b/);
    assert.match(html, /&amp;b=%22quoted%22/);
    assert.match(html, /rel="noopener noreferrer"/);
    assert.equal(instance.elements.get('brand-name').textContent, 'New brand');
    assert.equal(instance.elements.get(page === 'index.html' ? 'writing-title' : 'writing-page-title').textContent, 'New writing');
  });

  test(`${page}: unsafe article URLs have no clickable link`, async () => {
    const articles = unsafeUrls.map((url) => ({ title: 'Article', url }));
    const instance = await render(page, { writing: { articles } });
    const html = instance.elements.get(page === 'index.html' ? 'writing-preview-list' : 'writing-archive-list').innerHTML;
    assert.doesNotMatch(html, /<a\b/);
  });
}

const unsafeUrls = ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\nscript:alert(1)', 'data:text/html,bad', 'mailto:hello@beaudette.me', '//evil.invalid', '/relative', '', null, 42, 'https://', 'https://name:password@evil.invalid/', ' https://evil.invalid', 'https://evil.invalid/\t'];

test('URL policy accepts only absolute HTTP(S) web links and plain email addresses', () => {
  const { api } = client('index.html', () => ok(null));
  for (const value of unsafeUrls) assert.equal(api.webUrl(value), null, String(value));
  for (const value of ['https://beaudette.me/writing/', 'http://beaudette.me/', 'HTTPS://beaudette.me/']) assert.ok(api.webUrl(value));
  assert.equal(api.emailUrl('hello@beaudette.me'), 'mailto:hello@beaudette.me');
  assert.equal(api.emailUrl('hello+test@beaudette.me'), 'mailto:hello%2Btest@beaudette.me');
  for (const value of ['javascript:alert(1)', 'mailto:hello@beaudette.me', 'a@b.test?subject=bad', 'a@b.test\r\nBcc:x@y.test', '', null]) assert.equal(api.emailUrl(value), null);
});

test('contact rendering validates dynamic links and removes unsafe hrefs', async () => {
  const safe = await render('index.html', fallback);
  assert.equal(safe.elements.get('contact-email').attributes.href, 'mailto:hello@beaudette.me');
  assert.equal(safe.elements.get('contact-linkedin').attributes.href, fallback.contact.linkedinUrl);
  const unsafe = await render('index.html', { contact: { email: 'a@b.test?bcc=x@y.test', linkedinUrl: 'javascript:alert(1)' } });
  assert.equal(unsafe.elements.get('contact-email').attributes.href, undefined);
  assert.equal(unsafe.elements.get('contact-linkedin').attributes.href, undefined);
});
