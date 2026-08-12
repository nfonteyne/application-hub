const translations = {
  fr: {
    'nav.myProfile': 'Mon profil',
    'nav.myAccount': 'Mon compte',
    'nav.admin': 'Administration',
    'nav.logout': 'Se déconnecter',
    'nav.themeToggle': 'Changer de thème',
    'nav.langToggle': 'Switch to English',
    'index.title': 'Applications',
    'index.subtitle': 'Vos applications, en un clic.',
    'apps.empty': "Aucune application n'est encore disponible.",
    'apps.otherCategory': 'Autres',
    'admin.title': 'Administration',
    'admin.subtitle': 'Ajoutez, modifiez ou retirez les applications listées sur le hub, et organisez-les par catégorie.',
    'admin.appsHeading': 'Applications',
    'admin.addApp': '+ Ajouter une application',
    'admin.form.name': 'Nom',
    'admin.form.description': 'Description',
    'admin.form.url': 'URL',
    'admin.form.icon': "Icône (emoji) ou URL d'image externe",
    'admin.form.requiredGroup': 'Groupe Authentik requis',
    'admin.form.requiredGroupPlaceholder': 'laisser vide = visible par tous',
    'admin.form.category': 'Catégorie',
    'admin.form.noCategory': 'Aucune catégorie',
    'admin.form.position': 'Position',
    'admin.form.logo': "Logo téléversé (prioritaire sur le champ icône/URL ci-dessus)",
    'admin.form.currentLogoAlt': 'Logo actuel',
    'admin.form.removeLogo': 'Supprimer le logo actuel',
    'admin.form.save': 'Enregistrer',
    'admin.form.add': 'Ajouter',
    'admin.form.cancel': 'Annuler',
    'admin.table.name': 'Nom',
    'admin.table.url': 'URL',
    'admin.table.category': 'Catégorie',
    'admin.table.requiredGroup': 'Groupe requis',
    'admin.table.position': 'Position',
    'admin.table.all': 'Tous',
    'admin.table.edit': 'Modifier',
    'admin.table.delete': 'Supprimer',
    'admin.apps.empty': 'Aucune application pour le moment.',
    'admin.categoriesHeading': 'Catégories',
    'admin.addCategory': '+ Ajouter une catégorie',
    'admin.categories.empty': 'Aucune catégorie pour le moment.',
    'admin.confirmDeleteApp': 'Supprimer "{name}" ?',
    'admin.confirmDeleteCategory': 'Supprimer la catégorie "{name}" ? Les applications associées deviendront sans catégorie.',
    'admin.uploadLogoError': 'Échec du téléversement du logo',
    'profile.title': 'Mon profil',
    'profile.subtitle': 'Informations fournies par Authentik.',
    'profile.groups': 'Groupes',
    'profile.manageAccount': 'Gérer mon compte Authentik (mot de passe, etc.)',
  },
  en: {
    'nav.myProfile': 'My profile',
    'nav.myAccount': 'My account',
    'nav.admin': 'Admin',
    'nav.logout': 'Log out',
    'nav.themeToggle': 'Toggle theme',
    'nav.langToggle': 'Passer en français',
    'index.title': 'Applications',
    'index.subtitle': 'Your applications, one click away.',
    'apps.empty': 'No applications are available yet.',
    'apps.otherCategory': 'Other',
    'admin.title': 'Administration',
    'admin.subtitle': 'Add, edit, or remove the applications listed on the hub, and organize them into categories.',
    'admin.appsHeading': 'Applications',
    'admin.addApp': '+ Add an application',
    'admin.form.name': 'Name',
    'admin.form.description': 'Description',
    'admin.form.url': 'URL',
    'admin.form.icon': 'Icon (emoji) or external image URL',
    'admin.form.requiredGroup': 'Required Authentik group',
    'admin.form.requiredGroupPlaceholder': 'leave blank = visible to everyone',
    'admin.form.category': 'Category',
    'admin.form.noCategory': 'No category',
    'admin.form.position': 'Position',
    'admin.form.logo': 'Uploaded logo (takes priority over the icon/URL field above)',
    'admin.form.currentLogoAlt': 'Current logo',
    'admin.form.removeLogo': 'Remove current logo',
    'admin.form.save': 'Save',
    'admin.form.add': 'Add',
    'admin.form.cancel': 'Cancel',
    'admin.table.name': 'Name',
    'admin.table.url': 'URL',
    'admin.table.category': 'Category',
    'admin.table.requiredGroup': 'Required group',
    'admin.table.position': 'Position',
    'admin.table.all': 'Everyone',
    'admin.table.edit': 'Edit',
    'admin.table.delete': 'Delete',
    'admin.apps.empty': 'No applications yet.',
    'admin.categoriesHeading': 'Categories',
    'admin.addCategory': '+ Add a category',
    'admin.categories.empty': 'No categories yet.',
    'admin.confirmDeleteApp': 'Delete "{name}"?',
    'admin.confirmDeleteCategory': 'Delete category "{name}"? Its applications will become uncategorized.',
    'admin.uploadLogoError': 'Failed to upload the logo',
    'profile.title': 'My profile',
    'profile.subtitle': 'Information provided by Authentik.',
    'profile.groups': 'Groups',
    'profile.manageAccount': 'Manage my Authentik account (password, etc.)',
  },
};

function getLang() {
  return localStorage.getItem('hub-lang') === 'en' ? 'en' : 'fr';
}

function t(key, vars) {
  const lang = getLang();
  let str = (translations[lang] && translations[lang][key]) || translations.fr[key] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, v);
  }
  return str;
}

function setLang(lang) {
  localStorage.setItem('hub-lang', lang);
  window.location.reload();
}

function applyStaticTranslations() {
  document.documentElement.lang = getLang();
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
  });
}

applyStaticTranslations();
