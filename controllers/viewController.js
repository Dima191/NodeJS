const Tour = require('../model/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../model/userModel');
const Booking = require('../model/bookingModel');

exports.getOverview = catchAsync(async (req, res, next) => {
    const tours = await Tour.find();

    res
        .status(200)
        .render('overview', {
            title: 'All tours',
            tours
        })
})

exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findOne({slug: req.params.slug})
        .populate({
            path: 'reviews',
            select: 'review user rating'
        })
    if (!tour)
        return next(new AppError('No such tour', 400));

    res
        .status(200)
        .set(
            'Content-Security-Policy',
            'connect-src https://*.tiles.mapbox.com' +
            ' https://api.mapbox.com' +
            ' https://events.mapbox.com' +
            ' http://127.0.0.1:3000/api/v1/bookings/checkout-session/',
        )
        .render('tour', {
            title: `${tour.name} Tour`,
            tour,
        });
})

exports.getLoginForm = (req, res) => {
    res
        .status(200)
        .render('login', {
            title: 'User Login'
        })
}

exports.getAccount = (req, res) => {
    res
        .status(200)
        .render('account', {
            title: 'Your account'
        })
}

exports.updateUserData = async (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    if (!name || !email) {
        console.log('Something went wrong');
    }

    const user = await User.findByIdAndUpdate(req.user.id, {name, email}, {
        new: true,
        runValidators: true
    });
    if (!user)
        return next(new AppError('No such user', 401))

    res
        .status(200)
        .render('account', {
            title: 'Your account',
        })
}

exports.getMyTours = catchAsync(async (req, res, next) => {
    const bookings = await Booking.find({user: req.user.id});
    const tourIDs = bookings.map(el => el.tour);
    const tours = await Tour.find({_id: {$in: tourIDs}});
    res
        .status(200)
        .render('overview', {
            title: 'My Tours',
            tours
        })
})