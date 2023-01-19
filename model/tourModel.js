const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');
const Review = require('./reviewModel');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A Tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have less or equal 40 characters'],
        minlength: [10, 'A tour name must have more or equal 10 characters'],
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A Tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A Tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A Tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficult is either: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A Tour must have a price']
    },
    rating: {
        type: Number,
        default: 4.5,
        max: 5,
        min: 2
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                return val < this.price
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A Tour must have a summary']
    },
    description: {
        type: String,
        trim: true,
        required: [true, 'A Tour must have a description']
    },
    imageCover: {
        type: String,
        required: [true, 'A Tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: () => Date.now()
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false,
        select: false
    },
    startLocation: {
        //GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [{
        type: {
            type: String,
            default: 'Point',
            enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
    }],
    guides: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }]
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

tourSchema.index({price: 1, ratingsAverage: -1})
tourSchema.index({slug: 1})
tourSchema.index({startLocation: '2dsphere'})

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id',

});

//DOCUMENT MIDDLEWARE
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, {lower: true});
    next();
})
//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
    this.find({secretTour: {$ne: true}})
    next();
})

//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({
//         $match: {
//             secretTour: {$ne: true}
//         }
//     })
//     console.log(this);
//     next();
// })

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        fileds: '-__v -passwordChangeAt'
    });
    next();
})

const Tour = new mongoose.model('Tour', tourSchema);

module.exports = Tour;