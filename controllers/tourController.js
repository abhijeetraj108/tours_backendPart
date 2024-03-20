const { query } = require('express');
const Tour = require('../models/tourModel');
const factory = require('./handleFactory');
const { updateOne } = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  next();
};


exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour)
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = factory.deleteOne(Tour);


exports.getTourset = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gt: 4.5 } }
      },
      {
        $group: {
          _id: null,
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      {
        $sort: { avgPrice: 1 }
      }
    ])

    res.status(200).json({
      status: 'succes',
      data: {
        stats
      }
    })

  } catch (error) {
    res.status(402).json({
      status: 'succes',
      message: error
    })
  }
}


exports.getMonthlyPlan = async (req, res) => {
  try {
    let year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates'
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          sumTotal: { $sum: 1 },
          name: { $push: '$name' }
        }
      },
      {
        $sort: { sumTotal: -1 }
      },
      {
        $project: {
          _id: 0
        }
      },
      {
        $limit: 6
      }
    ])
    res.status(200).json({
      status: 'succes',
      data: {
        plan
      }
    })
  } catch (error) {
    res.stats(402).json({
      status: 'failed',
      message: error
    })
  }
};


// /tours-within/233/center/-40,45/unit/mi
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlan, unit } = req.params;
  const [lat, lan] = latlan.split(',');
  // const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lan) {
    next(new AppError('pls specify the location', 400));
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lan, lat], radius] } }
  });

  // const tours = Tour.find()

  console.log(radius, distance, '------------', lat, lan);
  console.log(tours, '*********************')//tour have some problems---------------

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  });
})


exports.getDistance = catchAsync( async (req, res, next) => {
  const { latlan, unit } = req.params;
  const [lat, lan] = latlan.split(',');
  // const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lan) {
    next(new AppError('pls specify the location', 400));
  }

  const multiplier = unit === 'mi' ? 0.000621371 : .001;


  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lan * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);


  res.status(200).json({
    status: 'success',   
    data: {
      data: distances
    }
  });
})