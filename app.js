(function () {
  const CMS_CONFIG = {
    provider: 'sanity',
    projectId: 'deoliu90',
    dataset: 'production',
    apiVersion: '2026-05-16',
    documentType: 'homepage',
    documentId: 'homepage',
    ...(window.SITE_CMS || {}),
  };

  async function loadContent() {
    const data = await loadSanityContent() || await loadLocalContent();

    if (data) {
      renderContent(data);
    }
  }

  async function loadSanityContent() {
    if (!isSanityConfigured()) {
      return null;
    }

    const query = `*[_type == "${CMS_CONFIG.documentType}" && _id == "${CMS_CONFIG.documentId}"][0]{
      siteName,
      hero,
      profile,
      now,
      writing,
      "writingArticles": writing.articles,
      contact
    }`;
    const url = `https://${CMS_CONFIG.projectId}.api.sanity.io/v${CMS_CONFIG.apiVersion}/data/query/${CMS_CONFIG.dataset}?query=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.result || null;
    } catch (error) {
      console.error('Sanity content load failed:', error);
      return null;
    }
  }

  async function loadLocalContent() {
    try {
      const response = await fetch('content/site.json', { cache: 'no-store' });
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Local content load failed:', error);
      return null;
    }
  }

  function renderContent(data) {
    setText('brand-name', data.siteName);

    setText('hero-label', data.hero?.sectionLabel);
    setText('hero-title', data.hero?.title);
    setText('hero-dek', data.hero?.dek);
    setText('hero-intro', data.hero?.intro);

    setText('profile-label', data.profile?.sectionLabel);
    setText('profile-title', data.profile?.title);
    setText('profile-body1', data.profile?.body1);
    setText('profile-body2', data.profile?.body2);

    setText('now-label', data.now?.sectionLabel);
    setText('now-title', data.now?.title);
    setText('now-body', data.now?.body);

    setText('writing-label', data.writing?.sectionLabel);
    setText('writing-title', data.writing?.title);
    setText('writing-link', data.writing?.linkText);
    setHref('writing-link', 'writing/');
    renderWritingPreview(data.writing?.articles || data.writingArticles || []);

    setText('contact-label', data.contact?.sectionLabel);
    setText('contact-title', data.contact?.title);
    setText('contact-body', data.contact?.body);
    setText('contact-email', data.contact?.email);
    setHref('contact-email', `mailto:${data.contact?.email || ''}`);
    setHref('contact-linkedin', data.contact?.linkedinUrl);
  }

  function isSanityConfigured() {
    return CMS_CONFIG.provider === 'sanity' &&
      typeof CMS_CONFIG.projectId === 'string' &&
      CMS_CONFIG.projectId.length > 0 &&
      CMS_CONFIG.projectId !== 'your-project-id';
  }

  function setText(id, value) {
    if (typeof value !== 'string') {
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    }
  }

  function setHref(id, value) {
    if (typeof value !== 'string' || value.length === 0) {
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.setAttribute('href', value);
    }
  }

  function renderWritingPreview(articles) {
    const container = document.getElementById('writing-preview-list');
    if (!container || !Array.isArray(articles) || articles.length === 0) {
      return;
    }

    const topArticles = articles.slice(0, 3);
    container.innerHTML = topArticles.map((article) => {
      const title = escapeHtml(article.title || 'Untitled');
      const summary = escapeHtml(article.summary || '');
      const publication = escapeHtml(article.publication || '');
      const publishedOn = escapeHtml(article.publishedOn || '');
      const url = typeof article.url === 'string' && article.url.length > 0 ? article.url : '#';
      const meta = [publication, publishedOn].filter(Boolean).join(' · ');
      return `
        <article class="writing-card">
          <p class="writing-meta">${escapeHtml(meta)}</p>
          <h3>${title}</h3>
          <p>${summary}</p>
          <a class="text-link" href="${escapeAttr(url)}" target="_blank" rel="noreferrer">Read article</a>
        </article>
      `;
    }).join('');
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  loadContent();
})();
