function appTileTemplate(app) {
  return `
    <a class="app-tile" href="${escapeHtml(app.url)}" target="_blank" rel="noopener noreferrer">
      <div class="app-tile-icon">${appIconHtml(app)}</div>
      <div class="app-tile-name">${escapeHtml(app.name)}</div>
      ${app.description ? `<p class="app-tile-desc">${escapeHtml(app.description)}</p>` : ''}
      ${app.required_group ? `<span class="app-tile-group">${escapeHtml(app.required_group)}</span>` : ''}
    </a>
  `;
}

// Apps already arrive ordered by category (uncategorized last), so a single
// pass groups consecutive same-category apps together.
function groupByCategory(apps) {
  const sections = [];
  let current = null;
  for (const app of apps) {
    const key = app.category_id || 'none';
    if (!current || current.key !== key) {
      current = { key, name: app.category_name || t('apps.otherCategory'), apps: [] };
      sections.push(current);
    }
    current.apps.push(app);
  }
  return sections;
}

function categorySectionTemplate(section, showHeading) {
  return `
    <section class="app-category">
      ${showHeading ? `<h2 class="category-title">${escapeHtml(section.name)}</h2>` : ''}
      <div class="card-grid">${section.apps.map(appTileTemplate).join('')}</div>
    </section>
  `;
}

async function loadApps() {
  const container = document.getElementById('apps-list');
  const errorBox = document.getElementById('error');
  try {
    const apps = await api.get('/api/apps');
    if (!apps.length) {
      container.innerHTML = `<p class="empty">${t('apps.empty')}</p>`;
      return;
    }
    const sections = groupByCategory(apps);
    // Only show category headings once categories are actually in use —
    // a single "Other" section (nobody has set up categories yet) stays unlabeled.
    const showHeadings = sections.length > 1 || sections[0].name !== t('apps.otherCategory');
    container.innerHTML = sections.map((s) => categorySectionTemplate(s, showHeadings)).join('');
  } catch (err) {
    errorBox.textContent = err.message;
  }
}

(async function init() {
  await initNav('hub');
  await loadApps();
})();
