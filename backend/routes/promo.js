const express = require("express");
const router = express.Router();
const promoController = require("../controllers/promoController");
const promoValidator = require("../validators/promoValidator");
const { protect } = require("../middleware/auth");
const { csrfProtection } = require("../middleware/csrf");

// ========== PUBLIC ROUTES ==========

/**
 * @route   POST /api/promo/validate
 * @desc    Validate promo code
 * @access  Public (No CSRF - read-only validation)
 */
router.post(
  "/validate",
  promoValidator.validatePromoCodeRequest,
  promoController.validatePromoCode
);

/**
 * @route   GET /api/promo/public
 * @desc    Get all active promo codes
 * @access  Public
 */
router.get("/public", promoController.getPublicPromoCodes);

/**
 * @route   POST /api/promo/apply
 * @desc    Apply promo code to booking
 * @access  Public
 */
router.post(
  "/apply",
  csrfProtection,
  promoValidator.validateApplyPromoCode,
  promoController.applyPromoCode
);

// ========== ADMIN ROUTES ==========

/**
 * @route   GET /api/promo/admin/stats
 * @desc    Get promo code statistics
 * @access  Admin only
 */
router.get("/admin/stats", protect, promoController.getPromoCodeStats);

/**
 * @route   GET /api/promo/admin
 * @desc    Get all promo codes with filters
 * @access  Admin only
 */
router.get(
  "/admin",
  protect,
  promoValidator.validateGetAllPromoCodes,
  promoController.getAllPromoCodes
);

/**
 * @route   POST /api/promo/admin
 * @desc    Create new promo code
 * @access  Admin only
 */
router.post(
  "/admin",
  protect,
  csrfProtection,
  promoValidator.validateCreatePromoCode,
  promoController.createPromoCode
);

/**
 * @route   GET /api/promo/admin/:id
 * @desc    Get promo code by ID
 * @access  Admin only
 */
router.get(
  "/admin/:id",
  protect,
  promoValidator.validatePromoCodeId,
  promoController.getPromoCodeById
);

/**
 * @route   PUT /api/promo/admin/:id
 * @desc    Update promo code
 * @access  Admin only
 */
router.put(
  "/admin/:id",
  protect,
  csrfProtection,
  promoValidator.validateUpdatePromoCode,
  promoController.updatePromoCode
);

/**
 * @route   DELETE /api/promo/admin/:id
 * @desc    Delete promo code
 * @access  Admin only
 */
router.delete(
  "/admin/:id",
  protect,
  csrfProtection,
  promoValidator.validatePromoCodeId,
  promoController.deletePromoCode
);

/**
 * @route   PATCH /api/promo/admin/:id/toggle
 * @desc    Toggle promo code active status
 * @access  Admin only
 */
router.patch(
  "/admin/:id/toggle",
  protect,
  csrfProtection,
  promoValidator.validatePromoCodeId,
  promoController.togglePromoCodeStatus
);

module.exports = router;
