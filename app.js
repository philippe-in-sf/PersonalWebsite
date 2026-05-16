(function () {
  async function loadContent() {
    try {
      const response = await fetch('content/site.json', { cache: 'no-store' });
      if (!response.ok) {
        return;
      }

      const data = await response.json();

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

      setText('contact-label', data.contact?.sectionLabel);
      setText('contact-title', data.contact?.title);
      setText('contact-body', data.contact?.body);
      setText('contact-email', data.contact?.email);
      setHref('contact-email', `mailto:${data.contact?.email || ''}`);
      setHref('contact-linkedin', data.contact?.linkedinUrl);
    } catch (error) {
      console.error('CMS content load failed:', error);
    }
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

  loadContent();
})();
