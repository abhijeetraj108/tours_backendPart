const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('../routes/reviewRoutes');


const router = express.Router();

  router.use('/:tourId/reviews', reviewRouter);


router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-set').get(tourController.getTourset)
router
.route('/monthly-plan/:year')
.get(authController.protect,
  authController.toRestrict('user','admin','lead-guide'),
  tourController.getMonthlyPlan)


  
  // /tours-within?distance=233&center=-40,45&unit=mi
  // /tours-within/233/center/-40,45/unit/mi

  router
  .route('/tours-within/:distance/center/:latlan/unit/:unit')
  .get(tourController.getToursWithin)

  router.route('/distances/:latlan/unit/:unit').get(tourController.getDistance);

// router.route('monthly-plan/:year').get(tourController.getMonthlyPlan)
router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour)

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect,
    authController.toRestrict('admin','lead-guide'),
    tourController.updateTour)
  .delete(authController.protect,
    authController.toRestrict('admin','lead-guide'),
    tourController.deleteTour);



module.exports = router;