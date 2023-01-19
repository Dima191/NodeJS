const mongoose = require('mongoose');

const Tour = require('./../model/tourModel');
const User = require('./../model/userModel');

const reviewSchema = mongoose.Schema({
    review: {
        type: String,
        require: [true, 'Review can not be empty ']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        require: [true, 'Review must have a rating']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})

reviewSchema.index({tour: 1, user: 1}, {unique: true})

reviewSchema.pre(/^find/, async function (next) {
    this.populate({
        path: 'user',
        fileds: 'name'
    })
    next();
})

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                numRatings: {$sum: 1},
                avgRating: {$avg: '$rating'}
            }
        }
    ])
    if (stats.length > 0)
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].numRatings,
            ratingsAverage: stats[0].avgRating
        })
    else
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        })


}

reviewSchema.post('save', async function () {
    this.constructor.calcAverageRatings(this.tour);
})

reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.doc = await this.findOne()
    next();
})

reviewSchema.post(/^findOneAnd/, async function () {
    await this.doc.constructor.calcAverageRatings(this.doc.tour);
})

const Review = new mongoose.model('Review', reviewSchema);

module.exports = Review;