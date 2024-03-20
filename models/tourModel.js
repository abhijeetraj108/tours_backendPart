const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');

const tourSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tours must have a price'],
    unique: true,
    trim: true,
    maxlength: [40, 'name must be length lessthan 40'],
    minlength: [10, 'A name must be be greater than 10'],
    // validate:[validator.isAlpha,'tour mus contain character only']
  },
  slug: String,
  diffuclty: {
    type: String,
    enum: {
      values: ['easy', 'medium', 'hard'],
      message: 'difficulty mus be only easy, hard and medium'
    }
    // required:[true,'A tour must have a difficulty']
  },
  secretTour: {
    type: Boolean,
    default: false
  },
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration']
  },
  ratingsAverage: {
    type: Number,
    min: [1, 'rating must be greater than  0'],
    max: [5, 'rating must be less than 5'],
    default: 4.5,
    set: val => Math.round(val*10)/10
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },
  discountPrice: {
    type: Number,
    validate: {
      validator: function (val) {
        return val < this.price
      },
      message: "price must be greater than discounted price"
    }

  },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
  summary: {
    type: String,
    required: [true, 'A tour must have a summary']
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a summary']
  },
  images: [String],
  createdAt: {
    type: Date,
    dafault: Date.now(),
    select: false
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    dafault: false
  },
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'user'
    }
  ]
}, 
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})


// tourSchema.index({price:1})
tourSchema.index({price : 1, ratingsAverage : -1 })
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation : '2dsphere' })


tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

//work for .save and .create only
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});


// tourSchema.pre(/^find/, function(next){
//   this.populate('guides');

//   next();
// })
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select:'-resetPassword -__v -passwordChangedAt -expireResetPassword'
  });


  next();
});




// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });


// tourSchema.post('save',function(nest){
//   console.log(this);
// })

// tourSchema.post('save',function(doc,next){
//   console.log(doc);
//   next();
// })

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (next) {
  console.log(`Query too ${Date.now() - this.start} milliseconds `);
  // next();
});



// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;