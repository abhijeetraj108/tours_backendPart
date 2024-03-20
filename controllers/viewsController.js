const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');



exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();

  res.status(200).render('overview', {
    tours
  })
})

exports.getTour = catchAsync(async (req, res) => {
  const tour = await Tour.find({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  // const p = tour[0].reviews
  // console.log(p);
  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }


  res.status(200).render('tour', {
    tour
  })
})

exports.getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  })
})