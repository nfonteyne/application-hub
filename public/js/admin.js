const panel = document.getElementById('add-app-panel');
const form = document.getElementById('add-app-form');
const toggleBtn = document.getElementById('toggle-add-app');
const cancelBtn = document.getElementById('cancel-app-form');
const submitBtn = document.getElementById('app-form-submit');
const errorBox = document.getElementById('error');
const currentLogoWrap = document.getElementById('current-logo-wrap');
const currentLogoImg = document.getElementById('current-logo-img');
const removeLogoBtn = document.getElementById('remove-logo-btn');

let appsById = new Map();
let categoriesById = new Map();

// ---------- Apps ----------

function openForm(app) {
  form.reset();
  form.id.value = app ? app.id : '';
  if (app) {
    form.name.value = app.name;
    form.description.value = app.description || '';
    form.url.value = app.url;
    form.icon.value = app.icon || '';
    form.requiredGroup.value = app.required_group || '';
    form.categoryId.value = app.category_id || '';
    form.position.value = app.position;
    submitBtn.textContent = t('admin.form.save');
    if (app.logo_object_key) {
      currentLogoWrap.style.display = 'flex';
      currentLogoImg.src = `/api/apps/${app.id}/logo`;
    } else {
      currentLogoWrap.style.display = 'none';
    }
  } else {
    submitBtn.textContent = t('admin.form.add');
    currentLogoWrap.style.display = 'none';
  }
  panel.style.display = 'block';
  form.name.focus();
}

function closeForm() {
  panel.style.display = 'none';
  form.reset();
}

toggleBtn.addEventListener('click', () => {
  if (panel.style.display === 'none') openForm(null);
  else closeForm();
});
cancelBtn.addEventListener('click', closeForm);

removeLogoBtn.addEventListener('click', async () => {
  const id = form.id.value;
  if (!id) return;
  try {
    await api.del(`/api/apps/${id}/logo`);
    currentLogoWrap.style.display = 'none';
    await loadApps();
  } catch (err) {
    errorBox.textContent = err.message;
  }
});

function appRowTemplate(app) {
  return `
    <tr data-id="${app.id}">
      <td>${appIconHtml(app)} ${escapeHtml(app.name)}</td>
      <td><a href="${escapeHtml(app.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(app.url)}</a></td>
      <td>${app.category_name ? escapeHtml(app.category_name) : '<span class="note">—</span>'}</td>
      <td>${app.required_group ? `<span class="chip">${escapeHtml(app.required_group)}</span>` : `<span class="note">${t('admin.table.all')}</span>`}</td>
      <td>${app.position}</td>
      <td class="row-actions">
        <button type="button" class="secondary" data-action="edit">${t('admin.table.edit')}</button>
        <button type="button" class="danger" data-action="delete">${t('admin.table.delete')}</button>
      </td>
    </tr>
  `;
}

async function loadApps() {
  const apps = await api.get('/api/apps');
  appsById = new Map(apps.map((a) => [String(a.id), a]));
  const tbody = document.getElementById('apps-table-body');
  const empty = document.getElementById('apps-empty');
  if (!apps.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  tbody.innerHTML = apps.map(appRowTemplate).join('');
}

document.getElementById('apps-table-body').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const row = btn.closest('tr');
  const app = appsById.get(row.dataset.id);
  if (btn.dataset.action === 'edit') {
    openForm(app);
  } else if (btn.dataset.action === 'delete') {
    if (!confirm(t('admin.confirmDeleteApp', { name: app.name }))) return;
    try {
      await api.del(`/api/apps/${app.id}`);
      await loadApps();
    } catch (err) {
      errorBox.textContent = err.message;
    }
  }
});

async function uploadLogo(appId, file) {
  const fd = new FormData();
  fd.append('logo', file);
  const res = await fetch(`/api/apps/${appId}/logo`, { method: 'POST', body: fd });
  if (res.status === 401) {
    window.location.href = '/auth/login?returnTo=' + encodeURIComponent(window.location.pathname);
    return new Promise(() => {});
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || t('admin.uploadLogoError'));
  }
  return res.json();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.textContent = '';
  const data = {
    name: form.name.value.trim(),
    description: form.description.value.trim(),
    url: form.url.value.trim(),
    icon: form.icon.value.trim(),
    requiredGroup: form.requiredGroup.value.trim(),
    categoryId: form.categoryId.value || null,
    position: parseInt(form.position.value, 10) || 0,
  };
  try {
    const app = form.id.value ? await api.put(`/api/apps/${form.id.value}`, data) : await api.post('/api/apps', data);
    const file = form.logoFile.files[0];
    if (file) {
      await uploadLogo(app.id, file);
    }
    closeForm();
    await loadApps();
  } catch (err) {
    errorBox.textContent = err.message;
  }
});

// ---------- Categories ----------

const categoryPanel = document.getElementById('add-category-panel');
const categoryForm = document.getElementById('add-category-form');
const categoryToggleBtn = document.getElementById('toggle-add-category');
const categoryCancelBtn = document.getElementById('cancel-category-form');
const categorySubmitBtn = document.getElementById('category-form-submit');

function openCategoryForm(category) {
  categoryForm.reset();
  categoryForm.id.value = category ? category.id : '';
  if (category) {
    categoryForm.name.value = category.name;
    categoryForm.position.value = category.position;
    categorySubmitBtn.textContent = t('admin.form.save');
  } else {
    categorySubmitBtn.textContent = t('admin.form.add');
  }
  categoryPanel.style.display = 'block';
  categoryForm.name.focus();
}

function closeCategoryForm() {
  categoryPanel.style.display = 'none';
  categoryForm.reset();
}

categoryToggleBtn.addEventListener('click', () => {
  if (categoryPanel.style.display === 'none') openCategoryForm(null);
  else closeCategoryForm();
});
categoryCancelBtn.addEventListener('click', closeCategoryForm);

function categoryRowTemplate(category) {
  return `
    <tr data-id="${category.id}">
      <td>${escapeHtml(category.name)}</td>
      <td>${category.position}</td>
      <td class="row-actions">
        <button type="button" class="secondary" data-action="edit">${t('admin.table.edit')}</button>
        <button type="button" class="danger" data-action="delete">${t('admin.table.delete')}</button>
      </td>
    </tr>
  `;
}

function populateCategorySelect(categories) {
  const select = document.getElementById('app-category-select');
  const selected = select.value;
  select.innerHTML =
    `<option value="">${t('admin.form.noCategory')}</option>` +
    categories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  select.value = selected;
}

async function loadCategories() {
  const categories = await api.get('/api/categories');
  categoriesById = new Map(categories.map((c) => [String(c.id), c]));
  const tbody = document.getElementById('categories-table-body');
  const empty = document.getElementById('categories-empty');
  if (!categories.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    tbody.innerHTML = categories.map(categoryRowTemplate).join('');
  }
  populateCategorySelect(categories);
}

document.getElementById('categories-table-body').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const row = btn.closest('tr');
  const category = categoriesById.get(row.dataset.id);
  if (btn.dataset.action === 'edit') {
    openCategoryForm(category);
  } else if (btn.dataset.action === 'delete') {
    if (!confirm(t('admin.confirmDeleteCategory', { name: category.name }))) return;
    try {
      await api.del(`/api/categories/${category.id}`);
      await loadCategories();
      await loadApps();
    } catch (err) {
      errorBox.textContent = err.message;
    }
  }
});

categoryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.textContent = '';
  const data = {
    name: categoryForm.name.value.trim(),
    position: parseInt(categoryForm.position.value, 10) || 0,
  };
  try {
    if (categoryForm.id.value) {
      await api.put(`/api/categories/${categoryForm.id.value}`, data);
    } else {
      await api.post('/api/categories', data);
    }
    closeCategoryForm();
    await loadCategories();
    await loadApps();
  } catch (err) {
    errorBox.textContent = err.message;
  }
});

// ---------- Init ----------

(async function init() {
  const me = await initNav('admin');
  if (!me.isAdmin) {
    window.location.href = '/index.html';
    return;
  }
  try {
    await loadCategories();
    await loadApps();
  } catch (err) {
    errorBox.textContent = err.message;
  }
})();
