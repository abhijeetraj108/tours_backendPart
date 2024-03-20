const express = require('express');
const viewController = require('../controllers/viewsController')
const authController = require('../controllers/authController');

const router = express.Router();


// router.get('/', viewController.getOverview);
// router.get('/tour/:slug', viewController.getTour);
// // router.get('/tour/:slug',authController.protect,  viewController.getTour);
// router.get('/login', viewController.login);


router.get('/', authController.isLoggedIn, viewController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
// router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
// router.get('/me', authController.protect, viewController.getAccount);

// router.post(
//     '/submit-user-data',
//     authController.protect,
//     viewController.updateUserData
//   );


module.exports = router;