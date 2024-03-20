const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(authController.toRestrict('user'),reviewController.setBeforeCreate,reviewController.createReview);

  router
  .get('/:id',reviewController.getReview)
  .patch('/:id',authController.toRestrict('user','admin'),reviewController.reviewUpdate)
  .delete('/:id',authController.toRestrict('user','admin'),reviewController.deleteReview);

//   router.route('/')
//   .get(reviewController.getAllReviews)
//   .post(authController.toRestrict('user'),authController.protect,reviewController.createReview);

// router
// .routes('/:id')
// .get(reviewController.deleteReview)

module.exports = router;