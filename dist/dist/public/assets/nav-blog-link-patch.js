(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function directChildLinks(parent) {
    return Array.from(parent.children).filter(function (el) { return el.tagName === 'A'; });
  }

  // Finds every nav-like container (desktop <nav> and the mobile dropdown)
  // that renders the site's primary Home / Properties / Favorites / Contact
  // menu, by locating the Contact link and checking its siblings.
  function findNavContainers() {
    const containers = [];
    qsa('a[href="/contact"]').forEach(function (contactLink) {
      const parent = contactLink.parentElement;
      if (!parent) return;
      const siblingLinks = directChildLinks(parent);
      const texts = siblingLinks.map(function (a) { return (a.textContent || '').trim(); });
      const looksLikeMainNav =
        texts.indexOf('Home') !== -1 &&
        texts.indexOf('Properties') !== -1 &&
        texts.indexOf('Favorites') !== -1 &&
        texts.indexOf('Contact') !== -1;
      if (looksLikeMainNav && containers.indexOf(parent) === -1) {
        containers.push(parent);
      }
    });
    return containers;
  }

  function buildBlogLink(referenceLink, isActive) {
    const link = document.createElement('a');
    link.href = '/blog';
    link.textContent = 'Blog';
    link.setAttribute('data-nav-blog-patch', 'true');

    // Reuse the Contact link's classes so font, spacing and hover states
    // match exactly; strip its conditional "active page" class first.
    const baseClasses = (referenceLink.className || '')
      .split(' ')
      .filter(function (token) { return token && token !== 'text-primary'; })
      .join(' ');
    link.className = isActive ? (baseClasses + ' text-primary').trim() : baseClasses;

    return link;
  }

  function patchNav(parent) {
    const contactLink = directChildLinks(parent).filter(function (a) {
      return a.getAttribute('href') === '/contact';
    })[0];
    if (!contactLink) return;

    const isActive = window.location.pathname === '/blog';
    const existing = qs('a[data-nav-blog-patch]', parent) || qs('a[href="/blog"]', parent);

    if (existing) {
      // Already inserted (by us or a previous pass) — just keep its active
      // state in sync with the current route on every scheduled run, since
      // React re-renders of the surrounding nav don't touch this node.
      const baseClasses = (contactLink.className || '')
        .split(' ')
        .filter(function (token) { return token && token !== 'text-primary'; })
        .join(' ');
      existing.className = isActive ? (baseClasses + ' text-primary').trim() : baseClasses;
      return;
    }

    const blogLink = buildBlogLink(contactLink, isActive);

    // Position it right before Contact, keeping the same order used on the
    // static /blog page's own nav: Home, Properties, Blog, Contact.
    parent.insertBefore(blogLink, contactLink);
  }

  function patch() {
    findNavContainers().forEach(patchNav);
  }

  let timer;
  function schedulePatch() {
    clearTimeout(timer);
    timer = setTimeout(patch, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedulePatch);
  } else {
    schedulePatch();
  }

  window.addEventListener('popstate', schedulePatch);

  new MutationObserver(schedulePatch).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
