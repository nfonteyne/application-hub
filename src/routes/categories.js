const express = require('express');
const categoriesRepo = require('../repositories/categoriesRepo');
const { requireAdmin } = require('../auth/middleware');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await categoriesRepo.findAll());
  })
);

function validateBody(body) {
  if (!body.name || !String(body.name).trim()) return 'name is required';
  return null;
}

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const error = validateBody(req.body);
    if (error) return res.status(400).json({ error });
    const category = await categoriesRepo.create({
      name: req.body.name.trim(),
      position: Number.isFinite(req.body.position) ? req.body.position : 0,
    });
    res.status(201).json(category);
  })
);

router.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const error = validateBody(req.body);
    if (error) return res.status(400).json({ error });
    const category = await categoriesRepo.update(req.params.id, {
      name: req.body.name.trim(),
      position: Number.isFinite(req.body.position) ? req.body.position : 0,
    });
    if (!category) return res.status(404).json({ error: 'not_found' });
    res.json(category);
  })
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    await categoriesRepo.remove(req.params.id);
    res.status(204).end();
  })
);

module.exports = router;
