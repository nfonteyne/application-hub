const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const appsRepo = require('../repositories/appsRepo');
const { requireAdmin } = require('../auth/middleware');
const asyncHandler = require('../lib/asyncHandler');
const config = require('../config');
const garage = require('../lib/garage');

const router = express.Router();

const ALLOWED_LOGO_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const apps = req.user.is_admin
      ? await appsRepo.findAll()
      : await appsRepo.findVisibleForGroups(req.user.groups);
    res.json(apps);
  })
);

function validateBody(body) {
  const { name, url } = body;
  if (!name || !String(name).trim()) return 'name is required';
  if (!url || !String(url).trim()) return 'url is required';
  try {
    // eslint-disable-next-line no-new
    new URL(url);
  } catch {
    return 'url must be a valid absolute URL';
  }
  return null;
}

function parseCategoryId(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const error = validateBody(req.body);
    if (error) return res.status(400).json({ error });

    const { name, description, url, icon, requiredGroup, position } = req.body;
    const app = await appsRepo.create({
      name: name.trim(),
      description: description ? String(description).trim() : null,
      url: url.trim(),
      icon: icon ? String(icon).trim() : null,
      requiredGroup: requiredGroup ? String(requiredGroup).trim() : null,
      categoryId: parseCategoryId(req.body.categoryId),
      position: Number.isFinite(position) ? position : 0,
      createdBy: req.user.id,
    });
    res.status(201).json(app);
  })
);

router.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const error = validateBody(req.body);
    if (error) return res.status(400).json({ error });

    const existing = await appsRepo.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'not_found' });

    const { name, description, url, icon, requiredGroup, position } = req.body;
    const app = await appsRepo.update(req.params.id, {
      name: name.trim(),
      description: description ? String(description).trim() : null,
      url: url.trim(),
      icon: icon ? String(icon).trim() : null,
      requiredGroup: requiredGroup ? String(requiredGroup).trim() : null,
      categoryId: parseCategoryId(req.body.categoryId),
      position: Number.isFinite(position) ? position : 0,
    });
    res.json(app);
  })
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const existing = await appsRepo.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'not_found' });
    if (existing.logo_object_key) {
      await garage
        .deleteObject(existing.logo_object_key)
        .catch((err) => console.warn('[garage] failed to delete logo on app removal:', err.message));
    }
    await appsRepo.remove(req.params.id);
    res.status(204).end();
  })
);

router.post(
  '/:id/logo',
  requireAdmin,
  (req, res, next) => {
    upload.single('logo')(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'file too large (max 5MB)' });
      }
      next(err);
    });
  },
  asyncHandler(async (req, res) => {
    if (!config.garage.configured) {
      return res.status(503).json({ error: 'garage_not_configured' });
    }
    const existing = await appsRepo.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'not_found' });
    if (!req.file) return res.status(400).json({ error: 'logo file is required' });

    const ext = ALLOWED_LOGO_MIME[req.file.mimetype];
    if (!ext) return res.status(400).json({ error: 'unsupported image type' });

    const key = `logos/${existing.id}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    await garage.putObject(key, req.file.buffer, req.file.mimetype);

    if (existing.logo_object_key) {
      await garage
        .deleteObject(existing.logo_object_key)
        .catch((err) => console.warn('[garage] failed to delete previous logo:', err.message));
    }

    const app = await appsRepo.setLogo(existing.id, key);
    res.json(app);
  })
);

router.delete(
  '/:id/logo',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const existing = await appsRepo.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'not_found' });
    if (existing.logo_object_key) {
      await garage
        .deleteObject(existing.logo_object_key)
        .catch((err) => console.warn('[garage] failed to delete logo:', err.message));
    }
    const app = await appsRepo.clearLogo(existing.id);
    res.json(app);
  })
);

router.get(
  '/:id/logo',
  asyncHandler(async (req, res) => {
    const app = await appsRepo.findById(req.params.id);
    if (!app || !app.logo_object_key) return res.status(404).end();
    if (!req.user.is_admin && app.required_group && !(req.user.groups || []).includes(app.required_group)) {
      return res.status(404).end();
    }
    try {
      const obj = await garage.getObject(app.logo_object_key);
      res.set('Content-Type', obj.ContentType || 'application/octet-stream');
      res.set('Cache-Control', 'private, max-age=3600');
      obj.Body.pipe(res);
    } catch (err) {
      console.warn('[garage] failed to fetch logo:', err.message);
      res.status(404).end();
    }
  })
);

module.exports = router;
