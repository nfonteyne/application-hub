function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function initials(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';
}

function avatarHtml(user, extraClass) {
  const cls = `avatar${extraClass ? ` ${extraClass}` : ''}`;
  if (user.avatarUrl) {
    return `<img class="${cls}" src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(user.name)}" loading="lazy">`;
  }
  return `<span class="${cls} avatar-initials">${escapeHtml(initials(user.name))}</span>`;
}

// An uploaded logo (stored in Garage, served through our own /logo route)
// takes priority; otherwise the "icon" field is either an external image
// URL or a short emoji/glyph — a cheap heuristic tells them apart.
function appIconHtml(app) {
  if (app.logo_object_key) {
    return `<img class="app-icon" src="/api/apps/${app.id}/logo" alt="">`;
  }
  const icon = app.icon;
  if (icon && (/^https?:\/\//.test(icon) || icon.startsWith('/'))) {
    return `<img class="app-icon" src="${escapeHtml(icon)}" alt="">`;
  }
  return escapeHtml(icon || '\u{1F5C2}️');
}
