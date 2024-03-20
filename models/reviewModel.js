const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        rating: {
            type: Number,
            min: [1, 'you can not rate below 1'],
            max: [5, 'maximum rating can not exceed 5']
        },
        review: {
            type: String,
            required: [true, 'pls give a review']
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'user',
            required: [true, 'Review must belong to a user']
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/,function(next){
    // this.populate({
    //     path:'tour',
    //     select:'name'
    // }).populate({
    //     path:'users',
    //     select:'name'
    // })

    this.populate({
        path:'user',
        select:'name photo'
    })

    next()
})

reviewSchema.statics.calcAverageRatings = async function(tourId){
    // const stats = this.find({tour:tourId});
    const stats = await this.aggregate([
        {
            $match:{tour : tourId}
        },
        {
            $group:{
                _id:'$tour',
                nRatings:{$sum : 1},
                ratingsAverage: { $avg : '$ratings'}
            }
        }
    ])
    console.log(stats,'-----------------------------------');
    if ( stats.length > 0 ){
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity : stats[0].nRatings,
            ratingsAverage : stats[0].ratingsAverage
        })
    }else{
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity : 0,
            ratingsAverage : 4.5
        })
    }

};


reviewSchema.post('save',function(){
    this.constructor.calcAverageRatings(this.tour)
});


//deleteing an dupdating tour
reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await this.findOne();
    console.log(this.r);
    next();
  });

  reviewSchema.post(/^findOneAnd/, async function() {
    // await this.findOne(); does NOT work here, query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour);
  });

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review