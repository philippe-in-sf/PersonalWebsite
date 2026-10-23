(function () {
  const { load, webUrl, emailUrl } = window.SiteContent;

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
    const articles = data.writing?.articles || data.writingArticles || [];
    renderArticles('writing-preview-list', articles, 3);
    setText('writing-page-label', data.writing?.sectionLabel);
    setText('writing-page-title', data.writing?.title);
    renderArticles('writing-archive-list', articles);

    setText('contact-label', data.contact?.sectionLabel);
    setText('contact-title', data.contact?.title);
    setText('contact-body', data.contact?.body);
    setText('contact-email', data.contact?.email);
    setHref('contact-email', data.contact?.email, emailUrl);
    setHref('contact-linkedin', data.contact?.linkedinUrl);
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

  function setHref(id, value, validate = webUrl) {
    if (value === undefined) return;
    const el = document.getElementById(id);
    if (!el) return;
    const url = validate(value);
    if (url) el.setAttribute('href', url);
    else el.removeAttribute('href');
  }

  function renderArticles(id, articles, limit = Infinity) {
    const container = document.getElementById(id);
    if (!container) return;
    const items = Array.isArray(articles)
      ? articles.filter((article) => article && typeof article === 'object' && !Array.isArray(article)).slice(0, limit)
      : [];
    if (items.length === 0) {
      container.innerHTML = '<p class="writing-empty">No articles are listed yet. Please check back later.</p>';
      return;
    }

    container.innerHTML = items.map((article) => {
      const title = escapeHtml(article.title || 'Untitled');
      const summary = escapeHtml(article.summary || '');
      const meta = escapeHtml([article.publication, article.publishedOn].filter(Boolean).join(' · '));
      const url = webUrl(article.url);
      const link = url ? `<a class="text-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Read article</a>` : '';
      return `
        <article class="writing-card">
          <p class="writing-meta">${meta}</p>
          <h3>${title}</h3>
          <p>${summary}</p>
          ${link}
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

  load().then((data) => {
    if (data) renderContent(data);
  });
})();
