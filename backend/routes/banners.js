const express = require('express');
const router = express.Router();
const BannerController = require('../controllers/bannerController');

// Public routes - Không cần authentication
router.get('/', BannerController.getActiveBanners);
router.post('/:id/view', BannerController.incrementView);
router.post('/:id/click', BannerController.incrementClick);

module.exports = router;
