function renderProfile(me) {
  document.getElementById('profile-avatar').innerHTML = avatarHtml(me);
  document.getElementById('profile-name').textContent = me.name;
  document.getElementById('profile-email').textContent = me.email || '';

  const groups = document.getElementById('profile-groups');
  const groupsLabel = document.getElementById('profile-groups-label');
  if (me.groups && me.groups.length) {
    groups.innerHTML = me.groups.map((g) => `<span class="chip">${escapeHtml(g)}</span>`).join('');
  } else {
    groupsLabel.style.display = 'none';
    groups.style.display = 'none';
  }

  const accountLink = document.getElementById('authentik-account-link');
  if (me.authentikAccountUrl) {
    accountLink.innerHTML = `<a href="${escapeHtml(me.authentikAccountUrl)}" target="_blank" rel="noopener noreferrer">${t('profile.manageAccount')}</a>`;
  }
}

(async function init() {
  const errorBox = document.getElementById('error');
  try {
    const me = await initNav('profile');
    renderProfile(me);
  } catch (err) {
    errorBox.textContent = err.message;
  }
})();
