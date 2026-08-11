const express = require('express');
const appsRouter = require('./apps');
const categoriesRouter = require('./categories');
const config = require('../config');

const router = express.Router();

router.use('/apps', appsRouter);
router.use('/categories', categoriesRouter);

function authentikAccountUrl() {
  if (!config.authentikPublicUrl) return null;
  return new URL('/if/user/', config.authentikPublicUrl).href;
}

router.get('/me', (req, res) => {
  const { id, name, username, email, avatar_url, groups, is_admin } = req.user;
  res.json({
    id,
    name,
    username,
    email,
    avatarUrl: avatar_url,
    groups,
    isAdmin: is_admin,
    authentikAccountUrl: authentikAccountUrl(),
  });
});

module.exports = router;
