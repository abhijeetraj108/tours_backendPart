const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();


router.get('/getMe',authController.protect,userController.getMe,userController.getUser);

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgetPassword',authController.forgetPassword);
router.patch('/resetPassword/:token',authController.resetPassword);


//after this all is protected
router.use(authController.protect);

router.patch('/updatePassword',authController.protect,authController.updatePassword);
router.patch('/updateMe',authController.protect,userController.updateMe);
router.delete('/deleteMe',authController.protect,userController.deleteMe);


//after this all routes is accesible to admin only
router.use(authController.toRestrict('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser)

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
