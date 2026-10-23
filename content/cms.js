(function () {
  // Keep the public CMS connection settings in this file only.
  const config = Object.freeze({
    provider: 'sanity',
    projectId: 'deoliu90',
    dataset: 'production',
    apiVersion: '2026-05-16',
    documentType: 'homepage',
    documentId: 'homepage',
  });
  const localUrl = new URL('site.json', document.currentScript.src).href;
  window.SITE_CMS = config;

  async function fetchContent(url, sanity = false) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return null;
      const payload = await response.json();
      const data = sanity ? payload?.result : payload;
      return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
    } catch (error) {
      console.error('Content load failed:', error);
      return null;
    }
  }

  async function load() {
    let data = null;
    if (config.provider === 'sanity' && config.projectId) {
      const query = `*[_type == ${JSON.stringify(config.documentType)} && _id == ${JSON.stringify(config.documentId)}][0]{siteName, hero, profile, now, writing, contact}`;
      const url = `https://${config.projectId}.api.sanity.io/v${config.apiVersion}/data/query/${config.dataset}?query=${encodeURIComponent(query)}`;
      data = await fetchContent(url, true);
    }
    return data || await fetchContent(localUrl);
  }

  // CMS links must be absolute web URLs; escaping alone does not make a URL safe.
  function webUrl(value) {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value) || /[\s\u0000-\u001f\u007f]/.test(value)) return null;
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
    } catch {
      return null;
    }
  }

  function emailUrl(value) {
    if (typeof value !== 'string' || !/^[^\s@<>:?#]+@[^\s@<>:?#]+\.[^\s@<>:?#]+$/.test(value) || /[\u0000-\u001f\u007f]/.test(value)) return null;
    return `mailto:${encodeURIComponent(value).replace('%40', '@')}`;
  }

  window.SiteContent = Object.freeze({ load, webUrl, emailUrl });
})();
