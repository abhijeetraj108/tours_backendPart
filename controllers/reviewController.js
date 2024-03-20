// const Review = require('../models/reviewModel');
const Review = require('./../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');



exports.setBeforeCreate = catchAsync(async (req,res,next)=> {

    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id;
  
    next();
})


exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review)
exports.reviewUpdate = factory.updateOne(Review)
exports.deleteReview = factory.deleteOne(Review);