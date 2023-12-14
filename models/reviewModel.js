//review //rating //createdAt //ref to tour //ref to user
const mongoose = require('mongoose');
const Tour = require('./../models/tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      requires: [true, 'Please add some comments']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must be there for a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must be associated with a user']
    }
  },
  {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

//Creating compound indrx to prevent duplicate reviews. Each user can add only 1 review for a specific tour.
//each combination of user and tour should be unique
reviewSchema.index({ user: 1, tour: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name'
  //   }).populate({
  //     path: 'user',
  //     select: 'name photo'
  //   });

  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

//Static Method to calculate the average Ratings
reviewSchema.statics.calcAvgRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        numRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  //console.log(stats);
  //saving the numRatings and ratings Avg into the database to persist the data
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQty: stats[0].numRatings,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQty: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  this.constructor.calcAvgRatings(this.tour);
});

//findByIdAndUpdate
//findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.reviewDoc = await this.findOne();
  //console.log(this.reviewDoc);
  next();
});

reviewSchema.post(/^findOneAnd/, async function(next) {
  await this.reviewDoc.constructor.calcAvgRatings(this.reviewDoc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
